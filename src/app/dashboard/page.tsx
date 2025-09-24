"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Play,
  Users,
  Eye,
  Video,
  Youtube,
  MessageSquare,
} from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import Image from "next/image";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommentCritiqueDialog } from "@/components/ui/comment-critique-dialog";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  url: string;
}

interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  uploadsPlaylistId?: string;
}

interface ChannelsResponse {
  channels: Channel[];
  totalChannels: number;
}

interface VideosResponse {
  channel: Channel;
  videos: Video[];
  totalResults: number;
}

export default function Dashboard() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [videosData, setVideosData] = useState<VideosResponse | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding state
  const [hasChannels, setHasChannels] = useState<boolean | null>(null);
  const [requiresGoogleOAuth, setRequiresGoogleOAuth] = useState(false);
  const [suggestions, setSuggestions] = useState<
    {
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
    }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [critiqueOpen, setCritiqueOpen] = useState(false);
  const [critiqueVideoId, setCritiqueVideoId] = useState<string | null>(null);
  const existingChannelIds = useMemo(() => {
    return new Set((channelsData?.channels || []).map((c) => c.id));
  }, [channelsData]);

  useEffect(() => {
    const checkChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/channels/check");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to check channels");
        }

        setHasChannels(Boolean(data.hasChannels));
        setRequiresGoogleOAuth(Boolean(data.requiresGoogleOAuth));

        if (data.hasChannels) {
          // data.channels are from DB: fields include channelId, title, ...
          const mapped = {
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
          } as ChannelsResponse;
          setChannelsData(mapped);
          if (mapped.channels.length > 0) {
            setSelectedChannelId(mapped.channels[0].id);
          }
        } else {
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkChannels();
  }, []);

  useEffect(() => {
    if (selectedChannelId) {
      fetchChannelVideos(selectedChannelId);
    }
  }, [selectedChannelId]);

  const fetchChannelVideos = async (channelId: string) => {
    try {
      setVideosLoading(true);
      const response = await fetch(`/api/youtube/channel/${channelId}/videos`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch videos");
      }

      const result = await response.json();
      setVideosData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setVideosLoading(false);
    }
  };

  const onSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      const res = await fetch(
        `/api/youtube/channels/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSearching(false);
    }
  };

  const onAddChannel = async (channelId: string) => {
    try {
      setAdding(channelId);
      setError(null);
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add channel");

      // Refresh state by re-checking
      const check = await fetch("/api/channels/check");
      const checkData = await check.json();
      if (check.ok && checkData.hasChannels) {
        const mapped = {
          channels: (checkData.channels || []).map((c: any) => ({
            id: c.channelId,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail,
            subscriberCount: String(c.subscriberCount ?? "0"),
            videoCount: String(c.videoCount ?? "0"),
            viewCount: String(c.viewCount ?? "0"),
          })),
          totalChannels: (checkData.channels || []).length,
        } as ChannelsResponse;
        setHasChannels(true);
        setChannelsData(mapped);
        setSelectedChannelId(mapped.channels[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAdding(null);
    }
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }
    return number.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
            <CardTitle className="text-red-800">
              Error Loading Channels
            </CardTitle>
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

  // Onboarding UI when user has no channels yet
  if (hasChannels === false) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[65vh]">
        <div className="absolute inset-0 -z-10 flex justify-end">
          <div className="w-[480px] h-[320px] bg-[#ec9347]/10 blur-2xl rounded-[48px]" />
        </div>
        <div className="absolute inset-0 -z-10 flex justify-start">
          <div className="w-[480px] h-[320px] bg-[#ec9347]/10 blur-2xl rounded-[48px]" />
        </div>
        <div className="w-full flex items-center justify-center py-6">
          <Image
            src="/logo.png"
            alt="Thryve logo"
            width={360}
            height={100}
            priority
          />
        </div>
        <Card className="border-[#ec9347]/30 bg-white">
          <CardHeader>
            <CardTitle className="text-[#ec9347] flex items-center space-x-2">
              <Youtube className="h-5 w-5" />
              <span>Connect a YouTube Channel</span>
            </CardTitle>
            <CardDescription className="text-black/70">
              {requiresGoogleOAuth
                ? "Sign in with Google to auto-detect your channels, or search by username."
                : "We found no channels in your account. Search by username or pick a suggestion."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Suggestions when available */}
            {suggestions.length > 0 ? (
              <div>
                <div className="text-sm font-medium mb-2">
                  Suggested from your Google account
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((s) => (
                    <Card
                      key={s.id}
                      className="p-4 flex items-start justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={s.thumbnail || undefined}
                            alt={s.title}
                          />
                          <AvatarFallback>{s.title?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium line-clamp-1">
                            {s.title}
                          </div>
                          <div className="text-xs text-black/60 line-clamp-1">
                            {s.description}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => onAddChannel(s.id)}
                        disabled={adding === s.id}
                        className="bg-[#ec9347] hover:bg-[#d6813c]"
                      >
                        {adding === s.id ? "Adding..." : "Add"}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="channelSearch">
                Or Search channel by name or username
              </Label>
              <div className="flex gap-2">
                <Input
                  id="channelSearch"
                  placeholder="e.g. Marques Brownlee"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  onClick={onSearch}
                  disabled={searching}
                  className="bg-[#ec9347] hover:bg-[#d6813c]"
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((r) => (
                  <Card
                    key={r.id}
                    className="p-4 flex items-start justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={r.thumbnail || undefined}
                          alt={r.title}
                        />
                        <AvatarFallback>{r.title?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium line-clamp-1">
                          {r.title}
                        </div>
                        <div className="text-xs text-black/60 line-clamp-1">
                          {r.description}
                        </div>
                        {r.subscriberCount ? (
                          <div className="text-xs text-black/70 mt-1 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {formatNumber(String(r.subscriberCount))}
                            </Badge>
                            {r.videoCount ? (
                              <Badge variant="secondary" className="text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                {formatNumber(String(r.videoCount))}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      onClick={() => onAddChannel(r.id)}
                      disabled={adding === r.id}
                      className="bg-[#ec9347] hover:bg-[#d6813c]"
                    >
                      {adding === r.id ? "Adding..." : "Add"}
                    </Button>
                  </Card>
                ))}
              </div>
            ) : null}
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
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Youtube className="h-6 w-6" />
                    <span>Your YouTube Channels</span>
                  </CardTitle>
                  <CardDescription>
                    Select a channel to view its videos
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setSearchResults([]);
                    setSearchQuery("");
                    setAddDialogOpen(true);
                  }}
                >
                  Add Channel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="">
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
                            src={channel.thumbnail}
                            alt={channel.title}
                          />
                          <AvatarFallback>
                            {channel.title?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">
                            {channel.title}
                          </CardTitle>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
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

        {/* Add Channel Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add another channel</DialogTitle>
              <DialogDescription>
                Search by channel name or username and add it to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Marques Brownlee"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  onClick={onSearch}
                  disabled={searching}
                  className="bg-primary hover:bg-primary/90"
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
              {searchResults.filter((r) => !existingChannelIds.has(r.id))
                .length > 0 ? (
                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-auto">
                  {searchResults
                    .filter((r) => !existingChannelIds.has(r.id))
                    .map((r) => (
                      <Card
                        key={r.id}
                        className="p-3 flex items-start justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={r.thumbnail || undefined}
                              alt={r.title}
                            />
                            <AvatarFallback>
                              {r.title?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium line-clamp-1">
                              {r.title}
                            </div>
                            <div className="text-xs text-black/60 line-clamp-1">
                              {r.description}
                            </div>
                            {r.subscriberCount || r.videoCount ? (
                              <div className="text-xs text-black/70 mt-1 flex items-center gap-2">
                                {r.subscriberCount ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {formatNumber(String(r.subscriberCount))}
                                  </Badge>
                                ) : null}
                                {r.videoCount ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    {formatNumber(String(r.videoCount))}
                                  </Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            await onAddChannel(r.id);
                            setAddDialogOpen(false);
                          }}
                          disabled={adding === r.id}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {adding === r.id ? "Adding..." : "Add"}
                        </Button>
                      </Card>
                    ))}
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {videosLoading && (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <LoadingPage message="Loading videos..." fullScreen={false} />
          </div>
        )}

        {/* Selected Channel Videos */}
        {selectedChannelId && videosData && (
          <>
            {/* Channel Header */}
            <Card>
              <CardHeader className="">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={videosData.channel.thumbnail}
                      alt={videosData.channel.title}
                    />
                    <AvatarFallback>
                      {videosData.channel.title?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {videosData.channel.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {videosData.channel.description}
                    </CardDescription>
                    <div className="flex space-x-4 mt-4">
                      <Badge
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <Users className="h-4 w-4" />
                        <span>
                          {formatNumber(videosData.channel.subscriberCount)}{" "}
                          subscribers
                        </span>
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <Video className="h-4 w-4" />
                        <span>
                          {formatNumber(videosData.channel.videoCount)} videos
                        </span>
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>
                          {formatNumber(videosData.channel.viewCount)} views
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Videos Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Latest Videos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videosData.videos.map((video) => (
                  <Card
                    key={video.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow p-0 pb-2"
                  >
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => window.open(video.url, "_blank")}
                    >
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        width={300}
                        height={300}
                        className="w-full h-72 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(video.url, "_blank");
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Watch
                        </Button>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {video.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatDate(video.publishedAt)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(video.url, "_blank")}
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCritiqueVideoId(video.id as string);
                              setCritiqueOpen(true);
                            }}
                            className="text-primary hover:text-primary/80"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <CommentCritiqueDialog
        open={critiqueOpen}
        onOpenChange={setCritiqueOpen}
        ytVideoId={critiqueVideoId}
      />
    </DashboardShell>
  );
}
