"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ExternalLink, Users, Video, Eye, Youtube } from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import {
  GapFinderDialog,
  GapResultsDialog,
} from "@/components/ui/gap-finder-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function SimilarChannelsPage() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Channel[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const [gapResultsOpen, setGapResultsOpen] = useState(false);
  const [gapResults, setGapResults] = useState<
    {
      gap_type: string;
      description: string;
      recommendation: string;
      priority: string;
    }[]
  >([]);

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
    const fetchSimilar = async () => {
      if (!selectedChannelId) return;
      try {
        setSimilarLoading(true);
        setError(null);
        const res = await fetch(
          `/api/channels/similar?ownerChannelId=${encodeURIComponent(
            selectedChannelId
          )}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load similar channels");
        setSimilar(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setSimilarLoading(false);
      }
    };
    fetchSimilar();
  }, [selectedChannelId]);

  const onDiscover = async () => {
    if (!selectedChannelId) return;
    try {
      setDiscovering(true);
      setError(null);
      const resp = await fetch("/api/channels/similar/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerChannelId: selectedChannelId }),
      });
      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data?.error || "Failed to discover similar channels");
      const res = await fetch(
        `/api/channels/similar?ownerChannelId=${encodeURIComponent(
          selectedChannelId
        )}`
      );
      const sim = await res.json();
      if (res.ok) setSimilar(sim.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDiscovering(false);
      setConfirmOpen(false);
    }
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    return number.toString();
  };

  // Provide similar channels as options for gap finder
  const similarOptions = similar.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    thumbnail: c.thumbnail,
  }));

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
                    Pick a channel to explore competitors and content gaps
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

        {/* Similar Channels */}
        {selectedChannelId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Similar Channels</CardTitle>
                  <CardDescription>
                    {similarLoading
                      ? "Fetching similar channels..."
                      : similar.length === 0
                      ? "No similar channels mapped yet"
                      : "Channels that are similar to your selection"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setGapOpen(true)}>
                    Find your Gaps
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setConfirmOpen(true)}
                    disabled={discovering}
                  >
                    {discovering ? "Discovering..." : "Discover Similar"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {similarLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                  <LoadingPage
                    message="Loading similar channels..."
                    fullScreen={false}
                  />
                </div>
              ) : similar.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[36vh] text-center space-y-3">
                  <div className="text-base font-medium">
                    No similar channels yet
                  </div>
                  <div className="text-sm text-black/60 max-w-md">
                    Start by discovering similar channels to your selected
                    channel. This helps you compare audience and content.
                  </div>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                    disabled={discovering}
                  >
                    {discovering
                      ? "Discovering..."
                      : "Discover Similar Channels (20 credits)"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similar.map((c) => (
                    <Card
                      key={c.id}
                      className="p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={c.thumbnail || undefined}
                            alt={c.title}
                          />
                          <AvatarFallback>{c.title?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium line-clamp-1">
                            {c.title}
                          </div>
                          <div className="text-xs text-black/60 line-clamp-2 max-w-[340px]">
                            {c.description}
                          </div>
                          <div className="text-xs text-black/70 mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {formatNumber(String(c.subscriberCount))}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              {formatNumber(String(c.videoCount))}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              {formatNumber(String(c.viewCount))}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://www.youtube.com/channel/${c.id}`,
                            "_blank"
                          )
                        }
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discover Similar Channels</DialogTitle>
            <DialogDescription>
              This will use 20 credits to find similar channels for your
              selected channel. It can take up to ~100 seconds.
              <p className="mt-5 font-bold">
                Do not close or refresh the page during this process.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={discovering}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={onDiscover}
              disabled={discovering}
            >
              {discovering
                ? "Processing... (up to ~100s)"
                : "Proceed (20 credits)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <GapFinderDialog
        open={gapOpen}
        onOpenChange={setGapOpen}
        ownerChannelId={selectedChannelId}
        similarChannels={similarOptions}
        onResults={(gaps) => {
          setGapResults(gaps);
          setGapResultsOpen(true);
        }}
      />
      <GapResultsDialog
        open={gapResultsOpen}
        onOpenChange={setGapResultsOpen}
        gaps={gapResults}
      />
    </DashboardShell>
  );
}
