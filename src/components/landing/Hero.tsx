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
              href="/sign-up"
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
              {/* Video Thumbnails */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-red-500/50 to-red-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* AI Brain Icon */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-purple-500/50 to-purple-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
                  </svg>
                </div>
              </div>

              {/* Transcript Icon */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-blue-500/50 to-blue-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
              </div>

              {/* Thumbnail Creation */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-orange-500/50 to-orange-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
                  </svg>
                </div>
              </div>

              {/* Content Ideas */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-green-500/50 to-green-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                  </svg>
                </div>
              </div>

              {/* Reels/Shorts */}
              <div className="relative h-20 rounded-md bg-gradient-to-br from-pink-500/50 to-pink-600/80 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
