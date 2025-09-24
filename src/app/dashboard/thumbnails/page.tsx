"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import ImageEditor from "@/components/ui/image-editor";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { UploadDropzone } from "@uploadthing/react";
import type { AppFileRouter } from "@/app/api/uploadthing/core";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { Loader, Download, Pencil } from "lucide-react";

type Channel = {
  channelId: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
};

type ThumbnailItem = {
  id: string;
  title: string;
  channelId: string;
  url?: string | null;
  createdAt: string;
};

export default function ThumbnailsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChannelLoading, setIsChannelLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<
    { id: string; url?: string; status: "uploaded" | "finished" }[]
  >([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageUrl, setEditorImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsChannelLoading(true);
        const res = await fetch("/api/channels/me");
        const data = await res.json();
        if (!mounted) return;
        if (res.ok) {
          setChannels(data.channels || []);
          if (data.channels?.[0]?.channelId) {
            setSelectedChannelId(data.channels[0].channelId);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setIsChannelLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/thumbnails?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok)
          throw new Error(data?.error || "Failed to load thumbnails");
        setThumbnails(data.thumbnails || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedChannelId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Channel selection header */}
        {channels.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Channels</CardTitle>
              <CardDescription>
                Select a channel to view completed thumbnails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {channels.map((c) => (
                  <Card
                    key={c.channelId}
                    className={`cursor-pointer transition-all ${
                      selectedChannelId === c.channelId
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedChannelId(c.channelId)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={c.thumbnail || undefined}
                          alt={c.title}
                        />
                        <AvatarFallback>{c.title?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-xs text-black/60">
                          {c.channelId}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : isChannelLoading ? (
          <div className=""></div>
        ) : (
          <Card>
            <CardContent className="p-6">No channels found.</CardContent>
          </Card>
        )}

        {/* Thumbnails grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Thumbnails</CardTitle>
            </div>
            <Button
              onClick={() => setOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Generate Thumbnail
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <LoadingPage
                  message="Loading Thumbnails..."
                  fullScreen={false}
                />
              </div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : thumbnails.length === 0 ? (
              <div className="text-black/70">No thumbnails yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {thumbnails.map((t) => (
                  <Card key={t.id} className="overflow-hidden p-0">
                    <div className="relative h-72 bg-gray-100">
                      {t.url ? (
                        <>
                          <Image
                            src={t.url}
                            alt={t.title || "Thumbnail"}
                            fill
                            className="object-cover"
                          />
                          <a
                            href={t.url}
                            download
                            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs text-black shadow hover:bg-white"
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 left-2 text-xs p-0"
                            onClick={() => {
                              if (t.url) {
                                setEditorImageUrl(t.url);
                                setEditorOpen(true);
                              } else {
                                toast.info("No image to edit");
                              }
                            }}
                          >
                            <Pencil className="h-2 w-2" /> Edit
                          </Button>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-black/50">
                          No image
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Thumbnail Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Thumbnail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <UploadButton
                  endpoint="thumbnailImage"
                  onUploadBegin={() => {
                    toast.info("Uploading images...");
                  }}
                  onClientUploadComplete={async (res: any[]) => {
                    try {
                      if (!selectedChannelId) return;

                      // Mark items as 'uploaded' first (no URL yet if not provided)
                      const uploadedItems = (res || []).map((file: any) => {
                        const id =
                          file?.key ||
                          file?.serverData?.fileKey ||
                          file?.url ||
                          String(Date.now());
                        return { id, status: "uploaded" as const };
                      });
                      setPreviews((prev) => [...prev, ...uploadedItems]);

                      // Create asset entries and then mark as finished with URLs
                      await Promise.all(
                        (res || []).map(async (file: any) => {
                          const url = file?.url || file?.serverData?.fileUrl;
                          const id =
                            file?.key ||
                            file?.serverData?.fileKey ||
                            url ||
                            String(Math.random());

                          if (url) {
                            await fetch("/api/assets", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                channelId: selectedChannelId,
                                url,
                                assetType: "thumbnail",
                                title: prompt?.slice(0, 120) || undefined,
                                description: prompt || undefined,
                              }),
                            });
                          }

                          setPreviews((prev) =>
                            prev.map((p) =>
                              p.id === id
                                ? { ...p, url: url, status: "finished" }
                                : p
                            )
                          );
                        })
                      );
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  onUploadError={(error: unknown) => {
                    console.error(error);
                  }}
                  appearance={{
                    button:
                      "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                    clearBtn:
                      "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                  }}
                  content={{
                    button: "Choose Files",
                    allowedContent: "Images up to 4MB",
                  }}
                />
                {previews.length > 0 ? (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {previews.map((p) => (
                      <div
                        key={p.id}
                        className="relative h-20 w-full rounded border overflow-hidden bg-gray-50 flex items-center justify-center"
                      >
                        {p.url ? (
                          <Image
                            src={p.url}
                            alt="preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs text-black/60">
                            Uploaded
                          </span>
                        )}
                        {p.status === "finished" ? (
                          <span className="absolute bottom-1 right-1 text-[10px] bg-green-600 text-white rounded px-1">
                            Finished
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  placeholder="Describe your thumbnail idea..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting || !selectedChannelId}
                  onClick={async () => {
                    if (!selectedChannelId) return;
                    try {
                      setSubmitting(true);
                      const images = previews
                        .filter(
                          (p) => p.status === "finished" && Boolean(p.url)
                        )
                        .map((p) => p.url as string);

                      const res = await fetch("/api/thumbnails", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          channelId: selectedChannelId,
                          // Only send images if user uploaded; otherwise backend will fallback
                          ...(images.length > 0 ? { images } : {}),
                          prompt: prompt || undefined,
                        }),
                      });

                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(
                          data?.error || "Failed to submit generation request"
                        );
                      }

                      toast.success(
                        "Thumbnail generation requested successfully"
                      );
                      setOpen(false);
                      setPrompt("");
                      setPreviews([]);
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Submission failed"
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Editor Modal */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="min-w-5xl w-full">
            <DialogHeader>
              <DialogTitle>Edit Thumbnail</DialogTitle>
            </DialogHeader>
            {editorImageUrl ? (
              <ImageEditor
                imageUrl={editorImageUrl}
                onClose={() => setEditorOpen(false)}
              />
            ) : (
              <div className="p-6 text-black/60">No image selected</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
