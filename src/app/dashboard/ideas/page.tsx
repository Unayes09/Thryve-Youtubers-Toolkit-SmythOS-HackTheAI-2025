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
  Sparkles,
  Loader,
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

interface GeneratedIdea {
  title: string;
  details_about_the_idea: string;
}

interface GeneratedIdeasResponse {
  next_video_suggestion: {
    id: string;
    name: string;
    result: {
      Output: {
        output: {
          [key: string]: GeneratedIdea;
        };
      };
    };
  };
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
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [showGeneratedIdeas, setShowGeneratedIdeas] = useState(false);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [isSavingGeneratedIdea, setIsSavingGeneratedIdea] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedIdeaForPlan, setSelectedIdeaForPlan] =
    useState<VideoIdea | null>(null);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [selectedIdeaForSEO, setSelectedIdeaForSEO] =
    useState<VideoIdea | null>(null);

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

  const handleViewPlan = (idea: VideoIdea) => {
    if (idea.plan) {
      try {
        const planData = JSON.parse(idea.plan);
        setCurrentPlan(planData);
        setPlanModalOpen(true);
      } catch (error) {
        console.error("Error parsing plan data:", error);
        toast.error("Error loading plan data");
      }
    }
  };

  const handleCreatePlan = async (idea: VideoIdea) => {
    if (!idea.title || !idea.description) {
      toast.error("Idea must have title and description to generate plan");
      return;
    }

    try {
      setGeneratingPlan(true);
      setSelectedIdeaForPlan(idea);

      const res = await fetch("/api/ideas/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          context: `${idea.title} - ${idea.description}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate plan");
      }

      // Update the idea with the new plan
      const updatedIdeas = videoIdeas.map((i) =>
        i.id === idea.id ? { ...i, plan: data.plan } : i
      );
      setVideoIdeas(updatedIdeas);

      // Show the plan in modal
      setCurrentPlan(data.planData);
      setPlanModalOpen(true);

      toast.success("Video plan generated successfully!");
    } catch (err) {
      console.error("Generate plan error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate plan"
      );
    } finally {
      setGeneratingPlan(false);
      setSelectedIdeaForPlan(null);
    }
  };

  const handleGenerateSEO = async (idea: VideoIdea) => {
    if (!idea.title) {
      toast.error("Idea must have a title to generate SEO keywords");
      return;
    }

    try {
      setGeneratingSEO(true);
      setSelectedIdeaForSEO(idea);

      const res = await fetch("/api/ideas/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          video_idea: idea.title,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate SEO keywords");
      }

      // Update the idea with the new SEO keywords
      const updatedIdeas = videoIdeas.map((i) =>
        i.id === idea.id ? { ...i, tags: data.keywords } : i
      );
      setVideoIdeas(updatedIdeas);

      toast.success("SEO keywords generated successfully!");
    } catch (err) {
      console.error("Generate SEO error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate SEO keywords"
      );
    } finally {
      setGeneratingSEO(false);
      setSelectedIdeaForSEO(null);
    }
  };

  const handleGenerateNextIdeas = async () => {
    if (!selectedChannelId) {
      toast.error("Please select a channel first");
      return;
    }

    try {
      setGeneratingIdeas(true);
      setError(null);

      const res = await fetch("/api/ideas/generate-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate video ideas");
      }

      // Extract ideas from the response
      const ideas = Object.values(
        data.next_video_suggestion.result.Output.output
      ) as GeneratedIdea[];
      setGeneratedIdeas(ideas);
      setShowGeneratedIdeas(true);
      setConfirmGenerateOpen(false);

      toast.success("Video ideas generated successfully!");
    } catch (err) {
      console.error("Generate ideas error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate ideas"
      );
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleSaveGeneratedIdea = async (
    idea: GeneratedIdea,
    index: number
  ) => {
    const newIsSavingGeneratedIdea = [...isSavingGeneratedIdea];
    newIsSavingGeneratedIdea[index] = true;
    setIsSavingGeneratedIdea(newIsSavingGeneratedIdea);
    if (!selectedChannelId) return;

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          title: idea.title,
          description: idea.details_about_the_idea,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save idea");
      }

      toast.success("Idea saved successfully!");

      // Refresh the ideas list
      const refreshRes = await fetch(
        `/api/ideas?channelId=${encodeURIComponent(selectedChannelId)}`
      );
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) {
        setVideoIdeas(refreshData.ideas || []);
      }
    } catch (err) {
      console.error("Save idea error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save idea");
    } finally {
      const newIsSavingGeneratedIdea = [...isSavingGeneratedIdea];
      newIsSavingGeneratedIdea[index] = false;
      setIsSavingGeneratedIdea(newIsSavingGeneratedIdea);
    }
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
            <CardTitle className="text-primary">Error</CardTitle>
            <CardDescription className="text-primary">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-primary hover:bg-red-100"
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

        {/* Generated Ideas Display */}
        {showGeneratedIdeas && generatedIdeas.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span>AI Generated Ideas</span>
                  </CardTitle>
                  <CardDescription>
                    {generatedIdeas.length} AI-generated video ideas for your
                    channel
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowGeneratedIdeas(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {generatedIdeas.map((idea, index) => (
                  <Card
                    key={index}
                    className="p-4 border-primary/20 bg-primary/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#2d2d2b]">
                            {idea.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-xs border-primary/20 text-primary"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        </div>

                        <p className="text-sm text-[#2d2d2b] mb-3">
                          {idea.details_about_the_idea}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveGeneratedIdea(idea, index)}
                          className="bg-primary hover:bg-primary text-white"
                          disabled={isSavingGeneratedIdea[index]}
                        >
                          {isSavingGeneratedIdea[index] ? (
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          {isSavingGeneratedIdea[index]
                            ? "Saving..."
                            : "Save Idea"}
                        </Button>
                      </div>
                    </div>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmGenerateOpen(true)}
                    disabled={generatingIdeas}
                  >
                    {generatingIdeas ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Generate Ideas
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={openCreateModal}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Idea
                  </Button>
                </div>
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
                            {idea.tags && (
                              <div className="flex flex-wrap gap-1">
                                {idea.tags.split(",").map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {idea.plan ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPlan(idea)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreatePlan(idea)}
                              disabled={
                                generatingPlan &&
                                selectedIdeaForPlan?.id === idea.id
                              }
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {generatingPlan &&
                              selectedIdeaForPlan?.id === idea.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateSEO(idea)}
                            disabled={
                              generatingSEO &&
                              selectedIdeaForSEO?.id === idea.id
                            }
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            {generatingSEO &&
                            selectedIdeaForSEO?.id === idea.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Tag className="h-4 w-4" />
                            )}
                          </Button>
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
                            className="text-primary hover:text-primary hover:bg-red-50"
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

      {/* Generate Ideas Confirmation Dialog */}
      <Dialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Generate AI Video Ideas</span>
            </DialogTitle>
            <DialogDescription>
              This will generate 5 AI-powered video ideas tailored to your
              channel. The process takes about 3 minutes, so please don't close
              this page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Estimated time: ~3 minutes
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Please keep this page open during generation
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmGenerateOpen(false)}
              disabled={generatingIdeas}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary text-white"
              onClick={handleGenerateNextIdeas}
              disabled={generatingIdeas}
            >
              {generatingIdeas ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Video Production Plan</span>
            </DialogTitle>
            <DialogDescription>
              Detailed production timeline for your video idea
            </DialogDescription>
          </DialogHeader>

          {currentPlan && (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {currentPlan.video_title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    <strong>Type:</strong>{" "}
                    {currentPlan.video_type.toUpperCase()}
                  </span>
                  <span>
                    <strong>Duration:</strong>{" "}
                    {currentPlan.estimated_total_days} days
                  </span>
                </div>
              </div>

              {/* Production Timeline */}
              <div>
                <h4 className="text-lg font-semibold mb-4">
                  Production Timeline
                </h4>
                <div className="space-y-4">
                  {currentPlan.production_timeline?.map(
                    (day: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-semibold text-lg">
                              {day.date_offset} - {day.phase}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {day.daily_goal}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Day {day.day}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {day.tasks?.map((task: any, taskIndex: number) => (
                            <div
                              key={taskIndex}
                              className="border-l-2 border-blue-200 pl-3 py-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{task.task}</span>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{task.duration}</span>
                                  <span>•</span>
                                  <span>{task.time_slot}</span>
                                  <Badge
                                    variant={
                                      task.priority === "high"
                                        ? "destructive"
                                        : task.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Deliverable:</strong> {task.deliverable}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPlanModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
