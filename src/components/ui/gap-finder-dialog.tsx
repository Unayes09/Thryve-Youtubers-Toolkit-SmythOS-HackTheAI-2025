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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Target,
} from "lucide-react";

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
  const [inputMode, setInputMode] = useState<"checkbox" | "manual">("checkbox");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualChannelIds, setManualChannelIds] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setInputMode("checkbox");
      setSelectedIds([]);
      setManualChannelIds("");
      setLoading(false);
      setError("");
      setIsValidating(false);
    }
  }, [open]);

  // Validate manual input in real-time
  useEffect(() => {
    if (inputMode === "manual" && manualChannelIds.trim()) {
      setIsValidating(true);
      const timeoutId = setTimeout(() => {
        const parsed = parseManualChannelIds(manualChannelIds);
        if (parsed.length === 0) {
          setError("Please enter at least one valid channel ID");
        } else if (
          parsed.some((id) => !id.startsWith("UC") || id.length !== 24)
        ) {
          setError(
            "Channel IDs should start with 'UC' and be 24 characters long"
          );
        } else {
          setError("");
        }
        setIsValidating(false);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setError("");
      setIsValidating(false);
    }
  }, [manualChannelIds, inputMode]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const parseManualChannelIds = (input: string): string[] => {
    return input
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  const onRun = async () => {
    if (!ownerChannelId) return;

    // Clear previous errors
    setError("");

    // Validate input based on mode
    if (mode === "similar") {
      const competitorIds =
        inputMode === "checkbox"
          ? selectedIds
          : parseManualChannelIds(manualChannelIds);

      if (competitorIds.length === 0) {
        setError(
          inputMode === "checkbox"
            ? "Please select at least one channel"
            : "Please enter at least one channel ID"
        );
        return;
      }

      // Additional validation for manual input
      if (inputMode === "manual") {
        const invalidIds = competitorIds.filter(
          (id) => !id.startsWith("UC") || id.length !== 24
        );
        if (invalidIds.length > 0) {
          setError(
            "Please ensure all channel IDs are valid (start with 'UC' and are 24 characters long)"
          );
          return;
        }
      }
    }

    try {
      setLoading(true);
      let url = "/api/channels/gaps";
      let payload: any = null;
      if (mode === "similar") {
        url = "/api/channels/gaps";
        const competitorIds =
          inputMode === "checkbox"
            ? selectedIds
            : parseManualChannelIds(manualChannelIds);
        payload = {
          yt_id: ownerChannelId,
          competitor_ids: competitorIds.join(", "),
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
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
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

  const getCompetitorCount = () => {
    if (mode === "overall") return 0;
    return inputMode === "checkbox"
      ? selectedIds.length
      : parseManualChannelIds(manualChannelIds).length;
  };

  const isFormValid = () => {
    if (!mode) return false;
    if (mode === "overall") return true;
    return getCompetitorCount() > 0 && !error;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Content Gap Analysis
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Discover content opportunities by analyzing your competitors
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analysis Mode</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  mode === "similar"
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setMode("similar")}
              >
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Competitor Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare against specific channels to find content gaps
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  mode === "overall"
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setMode("overall")}
              >
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Overall Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                      Find gaps across your entire content strategy
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Competitor Selection */}
          {mode === "similar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Select Competitors
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {getCompetitorCount()} selected
                </Badge>
              </div>

              {/* Input Method Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={inputMode === "checkbox" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setInputMode("checkbox")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Similar Channels
                </Button>
                <Button
                  variant={inputMode === "manual" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setInputMode("manual")}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>

              {/* Checkbox Selection Mode */}
              {inputMode === "checkbox" ? (
                <Card className="border-2 border-dashed border-gray-200">
                  <div className="max-h-64 overflow-auto p-4">
                    {similarChannels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No similar channels available</p>
                        <p className="text-xs">
                          Try the manual entry option instead
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {similarChannels.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              checked={selectedIds.includes(c.id)}
                              onCheckedChange={() => toggleId(c.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {c.title}
                              </div>
                              {c.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {c.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                /* Manual Input Mode */
                <div className="space-y-3">
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="channel-ids"
                          className="text-sm font-medium"
                        >
                          YouTube Channel IDs
                        </Label>
                        {isValidating && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {!isValidating && manualChannelIds && !error && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {error && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      <Textarea
                        id="channel-ids"
                        placeholder="UC1234567890abcdef, UCabcdef1234567890, UC9876543210fedcba"
                        value={manualChannelIds}
                        onChange={(e) => setManualChannelIds(e.target.value)}
                        className={`min-h-[120px] resize-none ${
                          error ? "border-red-300 focus:border-red-500" : ""
                        }`}
                      />

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Enter YouTube channel IDs separated by commas. You can
                          find channel IDs in the URL of a YouTube channel.
                        </div>
                        {error && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {error}
                          </div>
                        )}
                        {manualChannelIds && !error && !isValidating && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                            ✓ {getCompetitorCount()} valid channel ID
                            {getCompetitorCount() !== 1 ? "s" : ""} detected
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && mode === "similar" && inputMode === "checkbox" && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {mode === "overall"
                ? "Analysis will examine your entire content strategy"
                : `Analysis will compare against ${getCompetitorCount()} competitor${
                    getCompetitorCount() !== 1 ? "s" : ""
                  }`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={onRun}
                disabled={loading || !isFormValid()}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Find Gaps
                  </>
                )}
              </Button>
            </div>
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
    if (v === "high") return "bg-red-100 text-red-700 border-red-200";
    if (v === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const priorityIcon = (p: string) => {
    const v = p.toLowerCase();
    if (v === "high") return "🔴";
    if (v === "medium") return "🟡";
    return "🔵";
  };

  const getPriorityCount = (priority: string) => {
    return gaps.filter(
      (g) => g.priority.toLowerCase() === priority.toLowerCase()
    ).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl print:max-w-none print:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Content Gap Analysis Results
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {gaps.length > 0
                  ? `${gaps.length} content opportunity${
                      gaps.length !== 1 ? "ies" : "y"
                    } identified`
                  : "No content gaps found in your analysis"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {gaps.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {getPriorityCount("high")}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {getPriorityCount("medium")}
              </div>
              <div className="text-xs text-muted-foreground">
                Medium Priority
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">
                {getPriorityCount("low")}
              </div>
              <div className="text-xs text-muted-foreground">Low Priority</div>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          {gaps.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                <Target className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Gaps Found</h3>
              <p className="text-sm text-muted-foreground">
                Great job! Your content strategy appears to be well-rounded.
                Consider analyzing different competitors or time periods for
                more insights.
              </p>
            </Card>
          ) : (
            gaps.map((g, idx) => (
              <Card
                key={idx}
                className="p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {priorityIcon(g.priority)}
                      </span>
                      <h3 className="font-semibold text-lg">
                        {g.gap_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {g.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${priorityColor(
                      g.priority
                    )}`}
                  >
                    {g.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-blue-900 mb-1">
                        Recommendation
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {g.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {gaps.length > 0 && (
              <>
                Export this analysis as PDF to share with your team or save for
                reference.
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {gaps.length > 0 && (
              <Button
                onClick={() => window.print()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
