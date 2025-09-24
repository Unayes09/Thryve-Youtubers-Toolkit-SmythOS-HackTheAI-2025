"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface ChannelOption {
  id: string;
  title: string;
  description: string | null;
  thumbnail?: string | null;
}

export interface GapItem {
  gap_type: string;
  description: string;
  recommendation: string;
  priority: string;
}

interface GapFinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerChannelId: string | null;
  similarChannels: ChannelOption[];
  onResults?: (gaps: GapItem[]) => void;
}

export function GapFinderDialog({
  open,
  onOpenChange,
  ownerChannelId,
  similarChannels,
  onResults,
}: GapFinderDialogProps) {
  const [mode, setMode] = useState<"similar" | "overall" | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setSelectedIds([]);
      setLoading(false);
    }
  }, [open]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onRun = async () => {
    if (!ownerChannelId) return;
    if (mode === "similar" && selectedIds.length === 0) return;
    try {
      setLoading(true);
      let url = "/api/channels/gaps";
      let payload: any = null;
      if (mode === "similar") {
        url = "/api/channels/gaps";
        payload = {
          yt_id: ownerChannelId,
          competitor_ids: selectedIds.join(", "),
        };
      } else {
        url = "/api/channels/gaps/overall";
        payload = { yt_channel_id: ownerChannelId };
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to find gaps");
      const gaps: GapItem[] = data.content_gaps || [];
      onResults && onResults(gaps);
      onOpenChange(false);
    } catch (e) {
      // TODO: could add toast here
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    // Lightweight client-side PDF export via print
    // In a real app consider html2pdf / jsPDF. Here we open print dialog.
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find your Gaps</DialogTitle>
          <DialogDescription>
            Choose a mode, then optionally select competitors and run the gap
            finder.
          </DialogDescription>
        </DialogHeader>

        {/* Mode selection */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant={mode === "similar" ? "default" : "outline"}
              onClick={() => setMode("similar")}
            >
              Find gaps from your similar channels
            </Button>
            <Button
              variant={mode === "overall" ? "default" : "outline"}
              onClick={() => setMode("overall")}
            >
              Find gaps overall
            </Button>
          </div>

          {mode === "similar" ? (
            <div className="max-h-60 overflow-auto border rounded-md p-2 space-y-2">
              {similarChannels.length === 0 ? (
                <div className="text-sm text-black/60">
                  No similar channels available.
                </div>
              ) : (
                similarChannels.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-start gap-3 cursor-pointer py-2"
                  >
                    <Checkbox
                      checked={selectedIds.includes(c.id)}
                      onCheckedChange={() => toggleId(c.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">{c.title}</div>
                      <div className="text-xs text-black/60 line-clamp-2 max-w-[520px]">
                        {c.description}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              onClick={onRun}
              disabled={loading || !ownerChannelId || !mode}
            >
              {loading ? "Finding gaps... (up to ~100s)" : "Run Gap Finder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GapResultsDialog({
  open,
  onOpenChange,
  gaps,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  gaps: GapItem[];
}) {
  const priorityColor = (p: string) => {
    const v = p.toLowerCase();
    if (v === "high") return "bg-red-100 text-red-700";
    if (v === "medium") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl print:max-w-none print:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gap Analysis Results</DialogTitle>
          <DialogDescription>
            Content opportunities identified across selected competitors. You
            can export as PDF via your browser print menu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {gaps.length === 0 ? (
            <div className="text-sm text-black/60">No gaps found.</div>
          ) : (
            gaps.map((g, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {g.gap_type.toUpperCase()}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${priorityColor(
                      g.priority
                    )}`}
                  >
                    {g.priority.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-black/70">{g.description}</div>
                <div className="text-sm">
                  <span className="font-medium">Recommendation: </span>
                  {g.recommendation}
                </div>
              </Card>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>Export as PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
