"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { fadeUp, staggerContainer, floatY, inViewProps } from "@/lib/motion";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="mx-auto container px-4 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
            style={{ color: "#2d2d2b" }}
          >
            From idea to impact, effortlessly.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg text-black/70 max-w-prose"
          >
            AI-first workflow to fetch videos, generate ideas, craft thumbnails,
            and scale your channel.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <motion.a
              href="/signup"
              aria-label="Get Started for Free"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: "#ec9347" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started — Free
            </motion.a>
          </motion.div>
          <motion.p variants={fadeUp} className="text-sm text-black/60">
            No credit card required • Cancel anytime
          </motion.p>
        </motion.div>

        <motion.div
          variants={floatY}
          {...inViewProps}
          className="relative"
          aria-hidden
        >
          <div className="absolute -inset-6 bg-[#ec9347]/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Thryve" width={96} height={96} />
              <span className="text-sm font-medium">
                YouTube Fetch → Transcripts → Thumbnails → Reels
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-md bg-black/[.04] animate-pulse"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
