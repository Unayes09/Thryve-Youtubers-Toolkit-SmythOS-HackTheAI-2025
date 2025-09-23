"use client";
import { useEffect } from "react";
import { ErrorPage } from "@/components/error/ErrorPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      title="Something went wrong!"
      message="An unexpected error occurred. Please try again."
      showRetry={true}
      showHome={true}
      onRetry={reset}
      fullScreen={true}
    />
  );
}
