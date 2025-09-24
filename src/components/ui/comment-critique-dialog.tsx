"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function CommentCritiqueDialog({
  open,
  onOpenChange,
  ytVideoId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ytVideoId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>("");

  const runCritique = async () => {
    if (!ytVideoId) return;
    try {
      setLoading(true);
      setReply("");
      const resp = await fetch("/api/videos/comments/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yt_video_id: ytVideoId }),
      });
      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data?.error || "Failed to analyze comments");
      setReply(data.reply || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setReply("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comment Critique</DialogTitle>
          <DialogDescription>
            We will analyze your video comments and suggest improvements.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={runCritique}
              disabled={loading || !ytVideoId}
              className={`${reply ? "hidden" : ""}`}
            >
              {loading ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
          {reply ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply}</ReactMarkdown>
            </div>
          ) : null}
          {reply ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>Export as PDF</Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
