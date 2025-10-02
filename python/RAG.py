# app_comments_openai.py
# End-to-end FastAPI with OpenAI (ChatGPT) embeddings + Pinecone
# - POST /save_all_comments  -> fetch YT comments for a channel, embed with OpenAI, upsert to Pinecone
# - POST /query_comments     -> semantic search; return best video_id and its most relevant comments
#
# pip install fastapi uvicorn httpx openai pinecone

import asyncio
import time
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# --- OpenAI (ChatGPT) embeddings ---
# Docs: Vector embeddings guide + text-embedding-3 models. :contentReference[oaicite:0]{index=0}
from openai import OpenAI

# --- Pinecone (serverless SDK ≥5.x) ---
from pinecone import Pinecone, ServerlessSpec


# =========================
# Configuration (edit these)
# =========================
# Upstream that returns original videos (you already have this)
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path('../') / '.env'
load_dotenv(dotenv_path=env_path)





API_URL = "https://cmfwzo2zi1we6jxgtai6c9rye.agent.a.smyth.ai/api/Get_My_and_My_Competitors_Video_List"






# YouTube Data API key (used to fetch commentThreads)
YT_API_KEY = os.getenv("YT_API_KEY")



# OpenAI API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL    = "text-embedding-3-small"   # 1536-d (cheaper). Use "text-embedding-3-large" for highest quality. :contentReference[oaicite:1]{index=1}
EMBED_DIM      = 1536                       # Set 3072 if you use "text-embedding-3-large". :contentReference[oaicite:2]{index=2}



# Pinecone (serverless)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "yt-comments"
CLOUD      = "aws"        # or "gcp", "azure"
REGION     = "us-east-1"  # pick supported region for your cloud
NAMESPACE  = "youtube"    # change if you want per-project isolation







# =========================
# Clients & Index bootstrap
# =========================
openai_client = OpenAI(api_key=OPENAI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)

def _ensure_index(name: str, dimension: int, cloud: str, region: str):
    existing = [d["name"] for d in pc.list_indexes()]
    if name not in existing:
        
        print(name)
        
        pc.create_index(
            name=name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud=cloud, region=region),
        )
        # wait ready
        while True:
            if pc.describe_index(name).status.get("ready"):
                break
            time.sleep(1)

_ensure_index(INDEX_NAME, EMBED_DIM, CLOUD, REGION)
index = pc.Index(INDEX_NAME)


# =========================
# Helpers
# =========================
def _short_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    OpenAI embeddings. For search, you can reuse the same model for documents & queries.
    """
    if not texts:
        return []
    resp = openai_client.embeddings.create(model=EMBED_MODEL, input=texts)
    # resp.data is a list preserving order; each item has .embedding
    return [d.embedding for d in resp.data]


# =========================
# Provided async functions (unchanged)
# =========================
async def fetch_video_ids(query: str, yt_channel_id: str) -> List[str]:
    """
    Calls the upstream API and returns only the video IDs from original_videos.
    """
    payload = {"query": query, "yt_channel_id": yt_channel_id}
    timeout = httpx.Timeout(connect=250.0, read=250.0, write=250.0, pool=250.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(API_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()

    output = (data.get("result") or {}).get("Output") or {}
    orig_block = output.get("original_videos")

    if isinstance(orig_block, dict):
        video_list = orig_block.get("videoList", []) or []
    elif isinstance(orig_block, list):
        video_list = orig_block
    else:
        video_list = []

    return [
        v.get("video_id")
        for v in video_list
        if isinstance(v, dict) and v.get("video_id")
    ]


async def fetch_comments_for_video(
    video_id: str,
    yt_api_key: str,
    max_pages: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Fetches all top-level comments' textOriginal for a single video using
    the YouTube Data API v3 commentThreads endpoint, handling pagination.
    Returns: {"video_id": "<id>", "comments": ["textOriginal1", ...]}
    """
    base_url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {
        "part": "snippet",
        "videoId": video_id,
        "key": yt_api_key,
        "maxResults": 10,
    }

    comments: List[str] = []
    page = 0
    timeout = httpx.Timeout(connect=200.0, read=200.0, write=200.0, pool=200.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        next_page: Optional[str] = None
        while True:
            if next_page:
                params["pageToken"] = next_page
            else:
                params.pop("pageToken", None)

            resp = await client.get(base_url, params=params)
            resp.raise_for_status()
            data = resp.json()

            for it in data.get("items", []) or []:
                try:
                    txt = it["snippet"]["topLevelComment"]["snippet"]["textOriginal"]
                    if isinstance(txt, str) and txt.strip():
                        comments.append(txt.strip())
                except (KeyError, TypeError):
                    continue

            next_page = data.get("nextPageToken")
            page += 1
            if not next_page:
                break
            if max_pages is not None and page >= max_pages:
                break

    return {"video_id": video_id, "comments": comments}


async def collect_video_comments_from_query(
    query: str,
    yt_channel_id: str,
    yt_api_key: str,
    per_video_max_pages: Optional[int] = None,
    concurrency: int = 5,
) -> List[Dict[str, Any]]:
    """
    1) Uses fetch_video_ids(...) to get original video IDs.
    2) For each video ID, calls fetch_comments_for_video(...) to collect comments.
    3) Returns a list of {"video_id": "...", "comments": [...]} objects.
    """
    video_ids = await fetch_video_ids(query, yt_channel_id)
    if not video_ids:
        return []

    sem = asyncio.Semaphore(concurrency)

    async def _task(vid: str):
        async with sem:
            return await fetch_comments_for_video(
                video_id=vid,
                yt_api_key=yt_api_key,
                max_pages=per_video_max_pages,
            )

    results = await asyncio.gather(*[_task(v) for v in video_ids], return_exceptions=True)

    out: List[Dict[str, Any]] = []
    for r in results:
        if isinstance(r, Exception):
            continue
        out.append(r)
    return out



# =========================
# Pinecone upsert + search
# =========================
def save_video_comments_to_pinecone(
    video_comment_list: List[Dict[str, Any]],
    batch_size: int = 10,
    upsert_video_aggregate: bool = True,
) -> Dict[str, int]:
    """
    Stores each comment as one vector with metadata, plus optional per-video aggregate vector.
    Input: [{"video_id":"...", "comments": ["c1","c2", ...]}, ...]
    """
    total_comment_vecs = 0
    total_video_docs   = 0
    ts = _now_iso()

    for item in video_comment_list:
        video_id = item.get("video_id")
        comments = item.get("comments") or []
        if not video_id:
            continue

        # Clean + dedupe
        seen = set()
        clean_comments: List[str] = []
        for c in comments:
            if not isinstance(c, str):
                continue
            t = c.strip()
            if not t:
                continue
            h = _short_hash(t)
            if h in seen:
                continue
            seen.add(h)
            clean_comments.append(t)

        # Upsert comments in batches
        for i in range(0, len(clean_comments), batch_size):
            chunk = clean_comments[i:i+batch_size]
            if not chunk:
                continue
            vectors = embed_texts(chunk)  # OpenAI embeddings

            print(vectors)

            upserts = []
            for j, (text, vec) in enumerate(zip(chunk, vectors)):
                vid = f"{video_id}#{_short_hash(text)}#{i+j}"
                upserts.append({
                    "id": vid,
                    "values": vec,
                    "metadata": {
                        "type": "comment",
                        "video_id": video_id,
                        "text": text,
                        "source": "youtube",
                        "ingested_at": ts,
                    },
                })
            index.upsert(vectors=upserts, namespace=NAMESPACE)
            total_comment_vecs += len(upserts)

        # Optional: one aggregate vector per video (all comments concatenated)
        if upsert_video_aggregate and clean_comments:
            doc_text = "\n\n".join(clean_comments)
            vec = embed_texts([doc_text])[0]
            index.upsert(vectors=[{
                "id": f"{video_id}#all",
                "values": vec,
                "metadata": {
                    "type": "video_doc",
                    "video_id": video_id,
                    "text": doc_text[:8000],
                    "source": "youtube",
                    "ingested_at": ts,
                },
            }], namespace=NAMESPACE)
            total_video_docs += 1

    return {"comments": total_comment_vecs, "videos": total_video_docs}






def search_best_video_and_comments(query: str, per_video_top_k_sum: int = 5,
                                   pool_k: int = 200, per_video_return_k: int = 50) -> Dict[str, Any]:
    """
    1) Global semantic search across all comments to find the best video_id.
       Strategy: sum top-N scores per video_id (default 5) among the first pool_k matches.
    2) Return that video_id + its most relevant comments (per_video_return_k).
    """
    qvec = embed_texts([query])[0]
    res = index.query(
        vector=qvec,
        top_k=pool_k,
        include_metadata=True,
        namespace=NAMESPACE,
        filter={"type": {"$eq": "comment"}},
    )

    matches = res.get("matches", [])
    if not matches:
        return {"video_id": None, "comments": []}

    # Group scores by video
    from collections import defaultdict
    by_vid: Dict[str, List[float]] = defaultdict(list)
    for m in matches:
        md = m.get("metadata") or {}
        vid = md.get("video_id")
        if vid:
            by_vid[vid].append(m.get("score", 0.0))

    if not by_vid:
        return {"video_id": None, "comments": []}

    best_vid, best_sum = None, -1.0
    for vid, scores in by_vid.items():
        scores.sort(reverse=True)
        s = sum(scores[:per_video_top_k_sum])
        if s > best_sum:
            best_vid, best_sum = vid, s

    if not best_vid:
        return {"video_id": None, "comments": []}

    # Now fetch the top-k comments for that specific video
    res2 = index.query(
        vector=qvec,
        top_k=per_video_return_k,
        include_metadata=True,
        namespace=NAMESPACE,
        filter={"type": {"$eq": "comment"}, "video_id": {"$eq": best_vid}},
    )

    out_comments: List[str] = []
    seen = set()
    for m in res2.get("matches", []):
        md = m.get("metadata") or {}
        txt = md.get("text")
        if isinstance(txt, str) and txt and txt not in seen:
            out_comments.append(txt)
            seen.add(txt)

    return {"video_id": best_vid, "comments": out_comments}







# =========================
# FastAPI app & routes
# =========================
app = FastAPI(title="YouTube Comments: Save & Query (OpenAI + Pinecone)")

class SaveAllCommentsBody(BaseModel):
    yt_channel_id: str

@app.post("/save_all_comments")
async def save_all_comments(body: SaveAllCommentsBody):
    """
    Body:
    {
      "yt_channel_id": "UCIwFjwMjI0y7PDBVEO9-bkQ"
    }
    Fetch comments for all original videos (1 page per video by default),
    embed with OpenAI, and upsert into Pinecone.
    """
    yt_cnl_id = (body.yt_channel_id or "").strip()
    if not yt_cnl_id:
        raise HTTPException(status_code=400, detail="yt_channel_id is required")

    try:
        comments_data = await collect_video_comments_from_query(
            query="my query",                 # keep or alter based on your upstream behavior
            yt_channel_id=yt_cnl_id,
            yt_api_key=YT_API_KEY,
            per_video_max_pages=1,            # set None to fetch ALL pages (more quota)
            concurrency=5
        )

        print(comments_data)


        counts = save_video_comments_to_pinecone(
            comments_data, batch_size=10, upsert_video_aggregate=True
        )
        return {
            "channel_id": yt_cnl_id,
            "videos_found": len(comments_data),
            "upserted": counts,
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Upstream HTTP error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))










class QueryBody(BaseModel):
    Query: str



@app.post("/query_on_all_comments")
def query_comments(body: QueryBody):
    """
    Body:
    {
      "Query": "a query string"
    }
    Returns:
    {
      "video_id": "<best matching video id>",
      "comments": ["...", "...", ...]
    }
    """
    q = (body.Query or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query must be a non-empty string.")

    try:
        result = search_best_video_and_comments(q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))









from pydantic import BaseModel, Field


# ---------- Upstream endpoints ----------
AUTO_GAP_FINDER_URL = "https://cmfwzo2zi1we6jxgtai6c9rye.agent.a.smyth.ai/api/Auto_Gap_Finder"
LOCAL_QUERY_URL     = "http://localhost:8000/query_on_all_comments"
NEXT_IDEA_URL       = "https://cmfwzo2zi1we6jxgtai6c9rye.agent.a.smyth.ai/api/Next_Video_Suggestion"

# ---------- Request model ----------
class NextIdeaBody(BaseModel):
    query: str = Field(..., min_length=1, description="Seed query for Auto_Gap_Finder")
    yt_channel_id: str = Field(..., min_length=1, description="YouTube channel ID")
    # Optional: add your own extra phrases to query the local comment DB
    extra_phrases: Optional[List[str]] = Field(default=None, description="Extra query phrases for comment search")


# ---------- Helper ----------
DEFAULT_PHRASES = [
    "make another video",
    "please make a video",
    "can you make another video",
    "you should cover this next",
    "next video idea",
    "do a follow-up video",
    "make a video on this topic",
    "please do a detailed video",
    "can you cover this in your next video",
    "video request",
]

async def _post_json(client: httpx.AsyncClient, url: str, payload: Dict[str, Any]) -> Any:
    """POST JSON and return parsed JSON (or raise HTTPException)."""
    try:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        # Bubble up with upstream details
        raise HTTPException(status_code=e.response.status_code, detail=f"Upstream error: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Network error contacting {url}: {str(e)}")

    try:
        return resp.json()
    except ValueError:
        raise HTTPException(status_code=502, detail=f"Non-JSON response from {url}")


# ---------- The API ----------
@app.post("/Next_Video_Idea_Generator")
async def next_video_idea_generator(body: NextIdeaBody):
    """
    Body:
    {
      "query": "string",
      "yt_channel_id": "string",
      "extra_phrases": ["optional", "more", "phrases"]
    }
    Steps:
      1) POST to Auto_Gap_Finder -> response_01
      2) POST to local /query_on_all_comments for several variant phrases -> gather UNIQUE comments -> response_02
      3) POST to Next_Video_Suggestion with {response_01, response_02}
    """
    # Build phrase list
    phrases = list(DEFAULT_PHRASES)
    if body.extra_phrases:
        # Prepend/extend while keeping uniqueness & order
        seen = set()
        phrases = [p for p in body.extra_phrases if not (p in seen or seen.add(p))] + [
            p for p in DEFAULT_PHRASES if p not in seen and not (p in seen or seen.add(p))
        ]

    # Timeouts tuned for these backends
    timeout = httpx.Timeout(connect=200.0, read=200.0, write=200.0, pool=200.0)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        # 1) Auto_Gap_Finder -> response_01
        response_01 = await _post_json(
            client,
            AUTO_GAP_FINDER_URL,
            {"query": body.query, "yt_channel_id": body.yt_channel_id},
        )

        # 2) Query local DB multiple times -> collect UNIQUE comments
        unique_comments: List[str] = []
        seen = set()
        for phrase in phrases:
            data = await _post_json(client, LOCAL_QUERY_URL, {"Query": phrase})
            # Expecting shape like: {"video_id": "...", "comments": ["...", ...]}
            comments = data.get("comments") if isinstance(data, dict) else None
            if isinstance(comments, list):
                for c in comments:
                    if isinstance(c, str):
                        t = c.strip()
                        if t and t not in seen:
                            seen.add(t)
                            unique_comments.append(t)

        response_02 = unique_comments

        # 3) Next_Video_Suggestion with both responses
        final_payload = {
            "response_01": response_01,
            "response_02": response_02,
            "yt_id": body.yt_channel_id
        }
        final_response = await _post_json(client, NEXT_IDEA_URL, final_payload)

    # Return final suggestions plus light diagnostics
    return {
        "request": {
            "yt_channel_id": body.yt_channel_id,
            "seed_query": body.query,
            "phrases_used": phrases,
        },
        "response_01": response_01,
        "response_02_count": len(response_02),
        "next_video_suggestion": final_response,
    }











# --- Run locally ---
# python3 -m venv venv
# source venv/bin/activate   
# pip install -r requirements.txt 
# uvicorn RAG:app --reload
