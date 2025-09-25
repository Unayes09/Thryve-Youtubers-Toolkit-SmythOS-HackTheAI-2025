# Thryve

**From idea to impact, effortlessly.**

Thryve is an AI-powered platform designed to supercharge YouTube creators. It transforms raw content and data into actionable insights, fresh video ideas, and ready-to-publish assets — all in one streamlined workflow.

---

# ✨ Features

- **YouTube Channel Fetch + Transcription** – Connect your channel, fetch the latest 5 videos, auto-generate transcripts, and store them as vector embeddings for analysis and reuse.
- **Next Video Idea Generator** – Analyze competitor titles, user transcripts, comments, and trending news to suggest new video ideas, complete with draft titles, descriptions, tags, and transcription outlines.
- **Thumbnail Maker** – Auto-generate thumbnails based on past styles with editable text/images.
- **Highlights Maker** – Turn long videos into engaging shorts using transcript-based selection.
- **Reels Builder** – Create 10–15s reels from user photos, prompts, or clips with transitions, music, and overlays.
- **Competitor Gap Finder** – Compare competitors’ uploads to suggest trending but uncovered topics.
- **CTR Predictor** – Score your title + thumbnail combo as Low / Medium / High CTR using historical benchmarks.
- **Collaboration Finder** – Discover creators in your niche for collabs based on category + competitor analysis.
- **Voice Integration** – Extract the creator’s voice and reuse it for generated reels for consistency.
- **SEO Suggestions** – Auto-generate hashtags, tags, and hooks for better discoverability.
- **Comment Insights** – Summarize top comments into themes like questions, praises, or feedback.
- **Chapter Generator** – Auto-create YouTube chapters from video transcripts.
- **Video Planning + Calendar** – Plan upcoming videos and add them to an integrated site calendar.
- **Three User Tiers** – Free, Pro, Pro+ subscription plans powered by Stripe.

---


# Feature category:

##  Big Features (Main Modules)

1.  **User Authentication & Onboarding**
    
2.  **Dashboard (Main Hub)**
    
3.  **Home Page Management**
    
4.  **Video Ideas Generator + Plan for execution based on personal calender schedule analysis**
    
5.  **Thumbnail Generator**
    
6.  **Reels Maker**
    
7.  **Similar Channel Analyzer**
    
8.  **Audio Generator**
    
9.  **CTR Predictor**
    
10.  **Recharge & Payments**

    



## 🔎 Small Features (Sub-Functionalities)

### 1. **User Authentication & Onboarding**

-   Account creation
    
-   Sign in (existing user)
    
-   Onboarding process (new user)
    
    -   Fetch YouTube channels via Google ID
        
    -   Add channels manually
        


### 2. **Dashboard (Main Hub)**

-   Navigation menu to all tools:
    
    -   Home, Video Ideas, Thumbnail Generator, Reels Maker, Similar Channel, Audio Generator, CTR Predictor, Recharge
        


### 3. **Home Page Management**

-   View included channels
    
-   Add new channel
    
-   View uploaded videos
    
-   Single video comment analysis (via SmythOS agent)
    


### 4. **Video Ideas Generator**

-   Generate new ideas using intelligent agent (SmythOS)
    
-   Add custom video ideas manually
    
-   **Idea workflow**:
    
    -   Planning  (Analyze personal calender and based on the analysis + video structure  ===> plan the vide)
        
    -   Editing
        
    -   SEO tag generation (via SmythOS)
        
    -   Thumbnail generation based on idea (via SmythOS)
        


### 5. **Thumbnail Generator**

-   Generate thumbnail from **Images + Context** (via SmythOS)
    
-   Generate thumbnail from **Only Context** (via SmythOS)
    
-   **Thumbnail editing tools**:
    
    -   Editing (basic image adjustments)
        
    -   Format options (sizes, styles, export types)
        


### 6. **Reels Maker**

-   Create reels from images + context (via SmythOS)
    
-   Add audio to reels
    
-   Download final reels
    


### 7. **Similar Channel Analyzer**

-   Discover similar YouTube channels (via SmythOS)
    
-   Find video concept gaps using:
    
    -   Own channel + chosen similar channel
        
    -   Overall concept gap analysis (via SmythOS)
        


### 8. **Audio Generator**

-   Generate audio based on:
    
    -   Reference audio
        
    -   Speech-to-text / text-to-speech (via SmythOS)
        


### 9. **CTR Predictor**

-   Predict Click-Through-Rate based on Thumbnail + Title (via SmythOS)
    

### 10. **Recharge & Payments**

-   Stripe integration for payments & subscription recharges
    
  



<br>
<br>

# 🛠 Tech Stack

### Frontend
-   ![Next.js] **Next.js 15**: Framework for server-rendered React applications and full-stack features.
-   ![React](https://img.icons8.com/color/48/000000/react-native.png) **React 19**: Core library for building dynamic and interactive user interfaces.
### Backend
-   ![Node.js](https://img.icons8.com/color/48/000000/nodejs.png) **Node.js**: Server-side JavaScript runtime environment.
-   ![Express.js](https://img.icons8.com/ios/50/000000/express-js.png) **Express.js / Fastify**: Web frameworks for building APIs and managing service layers.
### Database
-   ![PostgreSQL](https://img.icons8.com/color/48/000000/postgreesql.png) **PostgreSQL**: Relational database for structured data management.
-   ![Prisma](https://img.icons8.com/color/48/prisma-orm.png) **Prisma ORM**: Toolkit for modeling and querying PostgreSQL efficiently.
### Vector Database
-   ![Pinecone] **Pinecone**: Vector database for semantic search and embeddings.
-   ![OpenAI](https://img.icons8.com/color/48/000000/openai.png) **OpenAI Embeddings**: Used for generating high-quality vector representations.   
### AI & Agent Building

-   ![Smythos](https://smythos.com/favicon.ico) **Smythos AI Agent Builder**: Platform for creating and deploying AI agents.
    
-   ![OpenAI](https://img.icons8.com/color/48/000000/openai.png) **AI/ML Models**:
    
    -   **ChatGPT 4o, 4.1 mini, GPT-5** – Conversational intelligence and reasoning.
        
    -   ![Voice AI](https://img.icons8.com/fluency/48/voice-recognition-scan.png) **Diatts Voice Cloning** – AI-powered personalized voice synthesis.
        
    -   ![Video AI](https://img.icons8.com/color/48/video.png) **Kling Video 2.5** – AI-based video generation for reels and short content.
        
    -   ![Speech to Text](https://img.icons8.com/color/48/000000/voice-presentation.png) **fal.ai Speech-to-Text** – Fast transcription service for audio inputs.
        
### Payments

-   ![Stripe](https://img.icons8.com/color/48/000000/stripe.png) **Stripe**: Subscription management and secure payment gateway.
    
### Storage
-   ![Uploadthing](https://uploadthing.com/favicon.ico) **Uploadthing**: Cloud storage and file handling system.
    






# ER Diagram:

<img src="images/Thryve ERD.png">


# End to End Activity Diagram:


<img src="images/End to End Activity Diagram.png">
