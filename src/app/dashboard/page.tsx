"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Play,
  Users,
  Eye,
  Video,
  Youtube,
  Settings,
} from "lucide-react";

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

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/youtube/videos");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch channels");
        }

        const result = await response.json();
        setChannelsData(result);

        // Auto-select first channel if available
        if (result.channels && result.channels.length > 0) {
          setSelectedChannelId(result.channels[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your YouTube channels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
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

  if (!channelsData || channelsData.channels.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center space-x-2">
              <Youtube className="h-5 w-5" />
              <span>No YouTube Channels Found</span>
            </CardTitle>
            <CardDescription className="text-yellow-600">
              You need to connect your YouTube account and have at least one
              channel to use this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              Check Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Channel Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Youtube className="h-6 w-6" />
            <span>Your YouTube Channels</span>
          </CardTitle>
          <CardDescription>
            Select a channel to view its videos and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelsData.channels.map((channel) => (
              <Card
                key={channel.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedChannelId === channel.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
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

      {/* Selected Channel Videos */}
      {selectedChannelId && videosData && (
        <>
          {/* Channel Header */}
          <Card>
            <CardHeader>
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
              {videosLoading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Loading videos...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videosData.videos.map((video) => (
                <Card
                  key={video.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <Button
                        size="sm"
                        className="opacity-0 hover:opacity-100 transition-opacity duration-200"
                        onClick={() => window.open(video.url, "_blank")}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(video.url, "_blank")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
