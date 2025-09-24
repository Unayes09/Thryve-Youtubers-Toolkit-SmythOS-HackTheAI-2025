"use client";
import { useSignIn } from "@clerk/nextjs";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Header } from "../../../components/landing/Header";
import { Footer } from "../../../components/landing/Footer";
import { AuthIllustration } from "../../../components/auth/AuthIllustration";
import Link from "next/link";

export default function Page() {
  const { isLoaded, signIn } = useSignIn();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryError = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (!code) return null;
    if (code === "not_authenticated") return "You need to sign in to continue.";
    if (code === "sync_failed")
      return "We couldn't sync your profile. Please try again.";
    if (code === "user_not_found")
      return "No account found. Please sign up to continue.";
    return "Sign in failed. Please try again.";
  }, []);

  const handleGoogle = useCallback(async () => {
    if (!isLoaded || !signIn || submitting) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in",
        redirectUrlComplete: "/auth/callback",
      });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "errors" in (err as any)
          ? (err as any).errors?.[0]?.message ||
            "Unable to sign in. Please try again."
          : (err as Error)?.message || "Unable to sign in. Please try again.";
      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [isLoaded, signIn, submitting]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mt-10">
        <section className="relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-[480px] h-[320px] bg-[#ec9347]/10 blur-2xl rounded-[48px]" />
          </div>
          <div className="mx-auto container px-4 py-16 flex items-center justify-center">
            <div className="w-full max-w-md text-center space-y-6 border border-black/10 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
              <h1 className="text-2xl font-semibold">Welcome back</h1>
              <p className="text-sm text-black/70">Sign in to continue</p>
              <div className="flex items-center justify-center gap-2 text-xs text-black/60">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-green-500"
                  aria-hidden
                />
                <span>Secure Google OAuth • No password required</span>
              </div>
              <AuthIllustration />
              {errorMessage || queryError ? (
                <div className="text-red-600 text-sm" role="alert">
                  {errorMessage || queryError}
                </div>
              ) : null}
              <Button
                onClick={handleGoogle}
                disabled={!isLoaded || submitting}
                className="w-full"
              >
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-black/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-black/60">or</span>
                </div>
              </div>
              <ul className="text-left text-sm text-black/70 space-y-2">
                <li>• Access your dashboard and manage projects</li>
                <li>• Sync profile securely across devices</li>
              </ul>
              <p className="text-xs text-black/60">
                New here?{" "}
                <Link href="/sign-up" className="underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
