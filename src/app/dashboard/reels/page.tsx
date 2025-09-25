"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video,
  Play,
  Pause,
  Download,
  Upload,
  Plus,
  FileText,
  Youtube,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";

interface Channel {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface ChannelsResponse {
  channels: Channel[];
  totalChannels: number;
}

interface ReelAsset {
  id: string;
  generatorId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  url: string | null;
  assetType: string;
  createdAt: string;
  updatedAt: string;
}

interface VideoIdea {
  title: string;
  description: string | null;
}

interface Reel {
  id: string;
  generatorId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  channelId: string;
  title: string;
  description: string | null;
  url: string | null;
  videoIdeaId: string;
  videoIdea: VideoIdea | null;
  reelAssets: ReelAsset[];
  createdAt: string;
  updatedAt: string;
}

interface ReelsResponse {
  reels: Reel[];
  totalReels: number;
}

export default function ReelsPage() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [playingReel, setPlayingReel] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  // Form states
  const [reelTitle, setReelTitle] = useState("");
  const [reelDescription, setReelDescription] = useState("");
  const [reelContext, setReelContext] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    const loadMyChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/channels/check");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load channels");
        if (!data.hasChannels) {
          setChannelsData({ channels: [], totalChannels: 0 });
          setSelectedChannelId(null);
          return;
        }
        const mapped: ChannelsResponse = {
          channels: (data.channels || []).map((c: any) => ({
            id: c.channelId,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail,
            subscriberCount: String(c.subscriberCount ?? "0"),
            videoCount: String(c.videoCount ?? "0"),
            viewCount: String(c.viewCount ?? "0"),
          })),
          totalChannels: (data.channels || []).length,
        };
        setChannelsData(mapped);
        if (mapped.channels.length > 0) {
          setSelectedChannelId(mapped.channels[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    loadMyChannels();
  }, []);

  useEffect(() => {
    const fetchReels = async () => {
      if (!selectedChannelId) return;
      try {
        setReelsLoading(true);
        setError(null);
        const res = await fetch(
          `/api/reels?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load reels");
        setReels(data.reels || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setReelsLoading(false);
      }
    };
    fetchReels();
  }, [selectedChannelId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    return number.toString();
  };

  const handlePlayPause = (reel: Reel) => {
    if (playingReel === reel.id) {
      setPlayingReel(null);
      setViewModalOpen(false);
      // Stop video when closing
      if (videoRef) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
    } else {
      setPlayingReel(reel.id);
      setSelectedReel(reel);
      setCurrentAssetIndex(0);
      setVideoLoading(true);
      setVideoError(null);
      setViewModalOpen(true);

      // Debug logging
      console.log("Selected reel:", reel);
      console.log("Reel URL:", reel.url);
      console.log("Reel status:", reel.status);
    }
  };

  const handleModalClose = () => {
    setViewModalOpen(false);
    setPlayingReel(null);
    setSelectedReel(null);
    // Stop video when modal is closed
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateReel = async () => {
    if (!reelTitle.trim() || !selectedChannelId) {
      toast.error("Please provide a title for the reel");
      return;
    }

    try {
      setUploading(true);
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          title: reelTitle.trim(),
          description: reelDescription.trim() || null,
          context: reelContext.trim() || null,
          images: uploadedImages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create reel");
      }

      toast.success(
        "Reel created successfully! It will appear in your reels when ready."
      );
      setCreateModalOpen(false);
      setReelTitle("");
      setReelDescription("");
      setReelContext("");
      setUploadedImages([]);

      // Refresh the reels list
      if (selectedChannelId) {
        const refreshRes = await fetch(
          `/api/reels?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setReels(refreshData.reels || []);
        }
      }
    } catch (err) {
      console.error("Reel creation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create reel");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingPage
          message="Loading your YouTube channels..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Channel Selection */}
        {channelsData?.channels && channelsData?.channels.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Youtube className="h-6 w-6" />
                    <span>Your Channels</span>
                  </CardTitle>
                  <CardDescription>
                    Pick a channel to view and create reels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelsData?.channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedChannelId === channel.id
                        ? "ring-2 ring-primary bg-primary/10"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={channel.thumbnail || undefined}
                            alt={channel.title}
                          />
                          <AvatarFallback>
                            {channel.title?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-1">
                            {channel.title}
                          </CardTitle>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              {formatNumber(channel.subscriberCount)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {formatNumber(channel.videoCount)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reels */}
        {selectedChannelId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Film className="h-6 w-6" />
                    <span>Your Reels</span>
                  </CardTitle>
                  <CardDescription>
                    {reelsLoading
                      ? "Loading reels..."
                      : reels.length === 0
                      ? "No reels created yet"
                      : `${reels.length} reel${
                          reels.length === 1 ? "" : "s"
                        } found`}
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Reel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {reelsLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                  <LoadingPage message="Loading reels..." fullScreen={false} />
                </div>
              ) : reels.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[36vh] text-center space-y-3">
                  <div className="text-base font-medium">
                    No reels created yet
                  </div>
                  <div className="text-sm text-black/60 max-w-md">
                    Create your first reel by adding context, images, and other
                    assets.
                  </div>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Reel
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reels.map((reel) => (
                    <Card
                      key={reel.id}
                      className="p-4 flex flex-col space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Film className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm line-clamp-1">
                              {reel.title}
                            </div>
                            <div className="text-xs text-black/60">
                              {formatDate(reel.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            reel.status === "COMPLETED"
                              ? "default"
                              : reel.status === "PROCESSING"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {reel.status}
                        </Badge>
                      </div>

                      {reel.description && (
                        <div className="text-xs text-black/60 line-clamp-2">
                          {reel.description}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-black/60">
                        {reel.videoIdea && (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>From idea</span>
                          </div>
                        )}
                      </div>

                      {reel.status === "COMPLETED" && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlayPause(reel)}
                            className="flex-1"
                          >
                            {playingReel === reel.id ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            {playingReel === reel.id ? "Pause" : "View"}
                          </Button>
                          {reel.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownload(reel.url!, `reel-${reel.id}.mp4`)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Reel Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create New Reel</span>
            </DialogTitle>
            <DialogDescription>
              Add context, images, and other details for your reel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reel-title">Reel Title *</Label>
              <Input
                id="reel-title"
                placeholder="Enter a title for your reel..."
                value={reelTitle}
                onChange={(e) => setReelTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="reel-description">Description</Label>
              <Textarea
                id="reel-description"
                placeholder="Enter a description for your reel..."
                value={reelDescription}
                onChange={(e) => setReelDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="reel-context">Context</Label>
              <Textarea
                id="reel-context"
                placeholder="Add context or instructions for your reel..."
                value={reelContext}
                onChange={(e) => setReelContext(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Media Assets</Label>
              <div className="mt-2 space-y-2">
                {uploadedImages.map((url, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center space-x-2 text-green-700">
                      {url.includes(".mp4") ||
                      url.includes(".webm") ||
                      url.includes(".mov") ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {url.includes(".mp4") ||
                        url.includes(".webm") ||
                        url.includes(".mov")
                          ? "Video"
                          : "Image"}{" "}
                        {index + 1} uploaded
                      </span>
                    </div>
                  </div>
                ))}
                <UploadButton
                  endpoint="thumbnailImage"
                  onUploadBegin={() => {
                    toast.info("Uploading media...");
                  }}
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setUploadedImages((prev) => [...prev, res[0].ufsUrl]);
                      toast.success("Media uploaded successfully");
                    }
                  }}
                  onUploadError={(error) => {
                    console.error(error);
                    toast.error("Failed to upload media");
                  }}
                  appearance={{
                    button:
                      "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                    clearBtn:
                      "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                  }}
                  content={{
                    button: "Add Media",
                    allowedContent: "Images up to 8MB",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreateReel}
              disabled={!reelTitle.trim() || uploading}
            >
              {uploading ? "Creating..." : "Create Reel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Reel Modal */}
      <Dialog open={viewModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md w-full mx-4 p-0">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={handleModalClose}
            >
              ✕
            </Button>

            {/* Video container */}
            <div className="aspect-[9/16] bg-black relative">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Loading video...</p>
                  </div>
                </div>
              )}

              {videoError ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75 mb-2">
                      Video failed to load
                    </p>
                    <p className="text-xs opacity-50">{videoError}</p>
                  </div>
                </div>
              ) : selectedReel?.url ? (
                <video
                  key={selectedReel.url}
                  ref={setVideoRef}
                  src={selectedReel.url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  onLoadStart={() => {
                    console.log("Video loading started");
                    setVideoLoading(true);
                  }}
                  onCanPlay={() => {
                    console.log("Video can play");
                    setVideoLoading(false);
                    setVideoError(null);
                  }}
                  onError={(e) => {
                    console.error("Video error:", e);
                    setVideoLoading(false);
                    setVideoError("Failed to load video");
                  }}
                  onLoadedData={() => {
                    console.log("Video data loaded");
                    setVideoLoading(false);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Reel processing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reel info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="text-white font-semibold text-lg mb-1">
                {selectedReel?.title}
              </h3>
              {selectedReel?.description && (
                <p className="text-white/80 text-sm line-clamp-2">
                  {selectedReel.description}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
