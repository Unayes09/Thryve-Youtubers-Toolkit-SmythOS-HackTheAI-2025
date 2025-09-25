import { useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface AudioBlendOptions {
  videoUrl: string;
  audioUrl: string;
  onProgress?: (progress: number) => void;
}

export interface AudioBlendResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export const useFFmpeg = () => {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadFFmpeg = useCallback(async () => {
    if (isLoaded) return;

    setIsLoading(true);
    try {
      const ffmpegInstance = new FFmpeg();

      // Set up progress tracking
      ffmpegInstance.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      // Load FFmpeg with the correct CDN URLs
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpegInstance.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });

      setFFmpeg(ffmpegInstance);
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const blendAudioWithVideo = useCallback(
    async ({
      videoUrl,
      audioUrl,
      onProgress,
    }: AudioBlendOptions): Promise<AudioBlendResult> => {
      try {
        // Ensure FFmpeg is loaded
        if (!ffmpeg || !isLoaded) {
          await loadFFmpeg();
        }

        if (!ffmpeg) {
          return { success: false, error: "FFmpeg failed to load" };
        }

        setIsLoading(true);
        setProgress(0);

        // Fetch the video and audio files
        const videoData = await fetchFile(videoUrl);
        const audioData = await fetchFile(audioUrl);

        // Write files to FFmpeg's virtual file system
        await ffmpeg.writeFile("input.mp4", videoData);
        await ffmpeg.writeFile("input.mp3", audioData);

        // Execute FFmpeg command to blend audio with video
        // -c:v copy: Copy video stream without re-encoding
        // -c:a aac: Encode audio as AAC
        // -shortest: Trim to shortest input (video length)
        // -map 0:v:0: Use video from first input
        // -map 1:a:0: Use audio from second input
        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-i",
          "input.mp3",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-shortest",
          "output.mp4",
        ]);

        // Read the output file
        const data = await ffmpeg.readFile("output.mp4");

        // Create blob from the output
        const blob = new Blob([data], { type: "video/mp4" });

        // Clean up files
        await ffmpeg.deleteFile("input.mp4");
        await ffmpeg.deleteFile("input.mp3");
        await ffmpeg.deleteFile("output.mp4");

        return { success: true, blob };
      } catch (error) {
        console.error("Audio blending failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        setIsLoading(false);
        setProgress(0);
      }
    },
    [ffmpeg, loadFFmpeg]
  );

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    ffmpeg,
    isLoading,
    isLoaded,
    progress,
    loadFFmpeg,
    blendAudioWithVideo,
    downloadBlob,
  };
};
