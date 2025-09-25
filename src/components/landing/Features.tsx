"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { hoverLift, staggerContainer, fadeUp, inViewProps } from "@/lib/motion";

const features = [
  {
    title: "Channel Fetch & Transcripts",
    desc: "Pull videos, parse transcripts in seconds.",
  },
  {
    title: "Idea Generator",
    desc: "AI turns transcripts into viral-ready ideas.",
  },
  { title: "Thumbnail Maker", desc: "On-brand thumbnails that boost CTR." },
  { title: "Reels Builder", desc: "Auto-cut reels with captions and beats." },
  { title: "CTR Predictor", desc: "Predict performance before you publish." },
  {
    title: "Competitor Gap Finder",
    desc: "Find untapped topics in your niche.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto container px-4">
        <motion.div
          className="mb-12 text-center"
          variants={fadeUp}
          {...inViewProps}
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            style={{ color: "#2d2d2b" }}
          >
            Everything to grow on{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              YouTube
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Powerful building blocks, designed for speed and conversion.
          </p>
        </motion.div>
        <motion.div
          variants={staggerContainer(0.06)}
          {...inViewProps}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                scale: 1.02,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-xl group"
            >
              <Card className="p-6 h-full border-orange-100/50 hover:border-orange-200/50 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                <h3
                  className="font-semibold mb-3 text-lg group-hover:text-orange-600 transition-colors duration-200"
                  style={{ color: "#2d2d2b" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {f.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
