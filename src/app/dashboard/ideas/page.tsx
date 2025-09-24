"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { toast } from "sonner";
import {
  Lightbulb,
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Youtube,
  Eye,
  Video,
  Clock,
  Tag,
} from "lucide-react";

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

interface VideoIdea {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  script: string | null;
  plan: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VideoIdeasResponse {
  ideas: VideoIdea[];
  totalIdeas: number;
}

export default function VideoIdeasPage() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<VideoIdea | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    script: "",
    plan: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

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
    const fetchVideoIdeas = async () => {
      if (!selectedChannelId) return;
      try {
        setIdeasLoading(true);
        setError(null);
        const res = await fetch(
          `/api/ideas?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load video ideas");
        setVideoIdeas(data.ideas || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIdeasLoading(false);
      }
    };
    fetchVideoIdeas();
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

  const handleCreateIdea = async () => {
    if (!selectedChannelId || !formData.title.trim()) {
      toast.error("Please provide a title for your video idea");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create video idea");
      }

      toast.success("Video idea created successfully!");
      setCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        script: "",
        plan: "",
        tags: "",
      });

      // Refresh the ideas list
      if (selectedChannelId) {
        const refreshRes = await fetch(
          `/api/ideas?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setVideoIdeas(refreshData.ideas || []);
        }
      }
    } catch (err) {
      console.error("Create idea error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditIdea = (idea: VideoIdea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      description: idea.description || "",
      script: idea.script || "",
      plan: idea.plan || "",
      tags: idea.tags || "",
    });
    setCreateModalOpen(true);
  };

  const handleUpdateIdea = async () => {
    if (!editingIdea || !formData.title.trim()) {
      toast.error("Please provide a title for your video idea");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/ideas/${editingIdea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update video idea");
      }

      toast.success("Video idea updated successfully!");
      setCreateModalOpen(false);
      setEditingIdea(null);
      setFormData({
        title: "",
        description: "",
        script: "",
        plan: "",
        tags: "",
      });

      // Refresh the ideas list
      if (selectedChannelId) {
        const refreshRes = await fetch(
          `/api/ideas?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setVideoIdeas(refreshData.ideas || []);
        }
      }
    } catch (err) {
      console.error("Update idea error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update idea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this video idea?")) return;

    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete video idea");
      }

      toast.success("Video idea deleted successfully!");

      // Refresh the ideas list
      if (selectedChannelId) {
        const refreshRes = await fetch(
          `/api/ideas?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setVideoIdeas(refreshData.ideas || []);
        }
      }
    } catch (err) {
      console.error("Delete idea error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete idea");
    }
  };

  const openCreateModal = () => {
    setEditingIdea(null);
    setFormData({ title: "", description: "", script: "", plan: "", tags: "" });
    setCreateModalOpen(true);
  };

  if (loading) {
    return (
      <LoadingPage
        message="Loading your YouTube channels..."
        fullScreen={true}
      />
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
    <DashboardShell>
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
                    Select a channel to view and manage video ideas
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
                              <Eye className="h-3 w-3 mr-1" />
                              {formatNumber(channel.subscriberCount)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
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

        {/* Video Ideas */}
        {selectedChannelId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-6 w-6" />
                    <span>Video Ideas</span>
                  </CardTitle>
                  <CardDescription>
                    {ideasLoading
                      ? "Loading video ideas..."
                      : videoIdeas.length === 0
                      ? "No video ideas yet"
                      : `${videoIdeas.length} video idea${
                          videoIdeas.length === 1 ? "" : "s"
                        } found`}
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={openCreateModal}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Idea
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {ideasLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                  <LoadingPage
                    message="Loading video ideas..."
                    fullScreen={false}
                  />
                </div>
              ) : videoIdeas.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[36vh] text-center space-y-3">
                  <div className="text-base font-medium">
                    No video ideas yet
                  </div>
                  <div className="text-sm text-black/60 max-w-md">
                    Start by creating your first video idea. Plan your content,
                    write scripts, and organize your creative process.
                  </div>
                  <Button
                    onClick={openCreateModal}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Idea
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoIdeas.map((idea) => (
                    <Card
                      key={idea.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold line-clamp-1">
                              {idea.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(idea.createdAt)}
                            </Badge>
                          </div>

                          {idea.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {idea.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {idea.script && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Has Script
                              </Badge>
                            )}
                            {idea.plan && (
                              <Badge variant="secondary" className="text-xs">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                Has Plan
                              </Badge>
                            )}
                            {idea.tags && (
                              <Badge variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {idea.tags.split(",").length} Tags
                              </Badge>
                            )}
                          </div>

                          {idea.script && (
                            <div className="text-xs text-gray-500 mb-2">
                              <strong>Script:</strong>{" "}
                              {idea.script.substring(0, 100)}
                              {idea.script.length > 100 && "..."}
                            </div>
                          )}

                          {idea.plan && (
                            <div className="text-xs text-gray-500">
                              <strong>Plan:</strong>{" "}
                              {idea.plan.substring(0, 100)}
                              {idea.plan.length > 100 && "..."}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditIdea(idea)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Idea Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>
                {editingIdea ? "Edit Video Idea" : "Create Video Idea"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {editingIdea
                ? "Update your video idea details below."
                : "Fill in the details for your new video idea."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter video title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your video idea..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="script">Script</Label>
              <Textarea
                id="script"
                placeholder="Write your video script here..."
                value={formData.script}
                onChange={(e) =>
                  setFormData({ ...formData, script: e.target.value })
                }
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="plan">Plan</Label>
              <Textarea
                id="plan"
                placeholder="Outline your video plan, structure, or key points..."
                value={formData.plan}
                onChange={(e) =>
                  setFormData({ ...formData, plan: e.target.value })
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas..."
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={editingIdea ? handleUpdateIdea : handleCreateIdea}
              disabled={!formData.title.trim() || submitting}
            >
              {submitting
                ? "Saving..."
                : editingIdea
                ? "Update Idea"
                : "Create Idea"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
