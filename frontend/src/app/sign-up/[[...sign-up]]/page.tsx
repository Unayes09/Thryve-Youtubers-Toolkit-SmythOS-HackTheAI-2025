"use client";
import { useSignUp } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Header } from "../../../components/landing/Header";
import { Footer } from "../../../components/landing/Footer";
import Link from "next/link";

export default function Page() {
  const { isLoaded, signUp } = useSignUp();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogle = useCallback(async () => {
    if (!isLoaded || !signUp || submitting) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up",
        redirectUrlComplete: "/auth/callback",
      });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "errors" in (err as any)
          ? (err as any).errors?.[0]?.message ||
            "Unable to sign up. Please try again."
          : (err as Error)?.message || "Unable to sign up. Please try again.";
      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [isLoaded, signUp, submitting]);

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
              <h1 className="text-2xl font-semibold">Create your account</h1>
              <p className="text-sm text-black/70">Sign up with Google</p>
              <div className="flex items-center justify-center gap-2 text-xs text-black/60">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-green-500"
                  aria-hidden
                />
                <span>Free plan • No credit card required</span>
              </div>
              <div className="grid grid-cols-3 gap-2" aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-md bg-black/[.04]" />
                ))}
              </div>
              {errorMessage ? (
                <div className="text-red-600 text-sm" role="alert">
                  {errorMessage}
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
                  <span className="bg-white px-2 text-black/60">
                    What you get
                  </span>
                </div>
              </div>
              <ul className="text-left text-sm text-black/70 space-y-2">
                <li>• AI-first workflow to kickstart your content</li>
                <li>• Sync across devices and collaborate</li>
                <li>• Upgrade anytime</li>
              </ul>
              <p className="text-xs text-black/60">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline">
                  Sign in
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
