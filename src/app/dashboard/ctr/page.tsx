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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  Image as ImageIcon,
  Youtube,
  FileText,
  Upload,
  Loader,
  Zap,
  Award,
} from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { UploadButton } from "@/utils/uploadthing";

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

interface CTRData {
  ctr_prediction: number;
  analysis: {
    visual_appeal_score: number;
    emotional_impact_score: number;
    title_thumbnail_alignment: number;
    curiosity_factor: number;
    text_readability: number;
    face_expression_quality: number;
    contrast_visibility: number;
    trending_elements: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  benchmark_comparison: string;
}

interface CTRResponse {
  id: string;
  name: string;
  result: {
    Output: {
      ctr_data: CTRData;
    };
  };
}

export default function CTRPredictorPage() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctrModalOpen, setCtrModalOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ctrResult, setCtrResult] = useState<CTRData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(
    null
  );

  // Load CTR data from localStorage on component mount
  useEffect(() => {
    const loadCTRData = () => {
      try {
        const savedData = localStorage.getItem("ctr-analysis-data");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setCtrResult(parsedData.ctrResult);
          setCurrentThumbnail(parsedData.currentThumbnail);
          setCurrentTitle(parsedData.currentTitle);
          setAnalysisTimestamp(parsedData.timestamp);
        }
      } catch (error) {
        console.error("Error loading CTR data from localStorage:", error);
      } finally {
        setIsLoadingFromStorage(false);
      }
    };

    loadCTRData();
  }, []);

  // Save CTR data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoadingFromStorage) {
      const ctrData = {
        ctrResult,
        currentThumbnail,
        currentTitle,
        timestamp: analysisTimestamp || new Date().toISOString(),
      };

      if (ctrResult) {
        localStorage.setItem("ctr-analysis-data", JSON.stringify(ctrData));
      } else {
        localStorage.removeItem("ctr-analysis-data");
      }
    }
  }, [
    ctrResult,
    currentThumbnail,
    currentTitle,
    analysisTimestamp,
    isLoadingFromStorage,
  ]);

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

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    return number.toString();
  };

  const handleCTRAnalysis = async () => {
    if (!videoTitle.trim() || !thumbnailUrl || !selectedChannelId) {
      toast.error("Please provide both video title and thumbnail image");
      return;
    }

    try {
      setAnalyzing(true);
      const res = await fetch("/api/ctr/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          prompt: videoTitle.trim(),
          image: thumbnailUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to analyze CTR");
      }

      setCtrResult(data.ctr_data);
      setCurrentThumbnail(thumbnailUrl);
      setCurrentTitle(videoTitle.trim());
      setAnalysisTimestamp(new Date().toISOString());
      toast.success("CTR analysis completed successfully!");
      setCtrModalOpen(false);
      setVideoTitle("");
      setThumbnailUrl(null);
    } catch (err) {
      console.error("CTR analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to analyze CTR");
    } finally {
      setAnalyzing(false);
    }
  };

  const getCTRColor = (ctr: number) => {
    if (ctr >= 0.8) return "text-green-600";
    if (ctr >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getCTRBadgeVariant = (ctr: number) => {
    if (ctr >= 0.8) return "default";
    if (ctr >= 0.6) return "secondary";
    return "destructive";
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getBenchmarkColor = (benchmark: string) => {
    switch (benchmark.toLowerCase()) {
      case "excellent":
        return "text-green-600";
      case "above average":
        return "text-blue-600";
      case "average":
        return "text-yellow-600";
      case "below average":
        return "text-orange-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading || isLoadingFromStorage) {
    return (
      <LoadingPage
        message={
          isLoadingFromStorage
            ? "Loading previous analysis..."
            : "Loading your YouTube channels..."
        }
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
                    Select a channel to analyze thumbnail CTR performance
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

        {/* CTR Analysis Section */}
        {selectedChannelId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>CTR Predictor</span>
                  </CardTitle>
                  <CardDescription>
                    Upload a thumbnail and video title to get instant CTR
                    analysis. Results are saved locally and will persist between
                    sessions.
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setCtrModalOpen(true)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  {ctrResult ? "Analyze New" : "Analyze CTR"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!ctrResult ? (
                <div className="flex flex-col items-center justify-center min-h-[36vh] text-center space-y-3">
                  <div className="text-base font-medium">
                    Ready for CTR Analysis
                  </div>
                  <div className="text-sm text-black/60 max-w-md">
                    Upload a thumbnail and video title to get instant CTR
                    predictions and optimization recommendations. Analysis
                    results are saved locally and will persist between sessions.
                  </div>
                  <Button
                    onClick={() => setCtrModalOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Analysis Info */}
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {currentThumbnail && (
                          <img
                            src={currentThumbnail}
                            alt="Current thumbnail"
                            className="w-16 h-9 object-cover rounded border"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm text-gray-700">
                            Current Analysis
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-1">
                            {currentTitle || "No title"}
                          </div>
                          {analysisTimestamp && (
                            <div className="text-xs text-gray-500 mt-1">
                              Analyzed:{" "}
                              {new Date(analysisTimestamp).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCtrResult(null);
                          setCurrentThumbnail(null);
                          setCurrentTitle("");
                          setAnalysisTimestamp(null);
                          localStorage.removeItem("ctr-analysis-data");
                        }}
                      >
                        Clear Analysis
                      </Button>
                    </div>
                  </Card>

                  {/* Main CTR Score */}
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2">
                      <span className={getCTRColor(ctrResult.ctr_prediction)}>
                        {(ctrResult.ctr_prediction * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-lg text-gray-600 mb-4">
                      Predicted Click-Through Rate
                    </div>
                    <Badge
                      variant={getCTRBadgeVariant(ctrResult.ctr_prediction)}
                      className="text-lg px-4 py-2"
                    >
                      {ctrResult.benchmark_comparison
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  </div>

                  {/* Analysis Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(ctrResult.analysis).map(([key, value]) => (
                      <Card key={key} className="p-4">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl font-bold">
                            <span className={getScoreColor(value)}>
                              {(value * 100).toFixed(0)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">/100</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              value >= 0.8
                                ? "bg-green-500"
                                : value >= 0.6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${value * 100}%` }}
                          ></div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <span>Strengths</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="space-y-2">
                          {ctrResult.strengths.map((strength, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="p-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-red-700">
                          <XCircle className="h-5 w-5" />
                          <span>Areas for Improvement</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="space-y-2">
                          {ctrResult.weaknesses.map((weakness, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card className="p-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-blue-700">
                        <Lightbulb className="h-5 w-5" />
                        <span>Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-3">
                        {ctrResult.recommendations.map(
                          (recommendation, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-3"
                            >
                              <Award className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{recommendation}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTR Analysis Modal */}
      <Dialog open={ctrModalOpen} onOpenChange={setCtrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>CTR Analysis</span>
            </DialogTitle>
            <DialogDescription>
              Upload a thumbnail and enter your video title to predict CTR
              performance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                placeholder="Enter your video title..."
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Thumbnail Image</Label>
              {thumbnailUrl ? (
                <div className="mt-2 p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-2 text-green-700">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">
                      Thumbnail uploaded successfully
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <UploadButton
                    onUploadBegin={() => {
                      toast.info("Uploading thumbnail...");
                    }}
                    endpoint="thumbnailImage"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setThumbnailUrl(res[0].ufsUrl);
                        toast.success("Thumbnail uploaded successfully");
                      }
                    }}
                    onUploadError={(error) => {
                      console.error(error);
                      toast.error("Failed to upload thumbnail");
                    }}
                    appearance={{
                      button:
                        "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                      clearBtn:
                        "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                      container:
                        "border-dashed border-2 border-gray-300 rounded-lg p-6",
                    }}
                    content={{
                      button: "Choose Files",
                      allowedContent: "Image up to 2MB",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCtrModalOpen(false)}
              disabled={analyzing}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleCTRAnalysis}
              disabled={!videoTitle.trim() || !thumbnailUrl || analyzing}
            >
              {analyzing ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze CTR
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
