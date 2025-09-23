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
        <motion.div className="mb-8" variants={fadeUp} {...inViewProps}>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#2d2d2b" }}
          >
            Everything to grow on YouTube
          </h2>
          <p className="text-black/70 mt-2">
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
              whileHover={{ y: -4, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.25 }}
              className="rounded-xl"
            >
              <Card className="p-6 h-full">
                <h3 className="font-semibold mb-1" style={{ color: "#2d2d2b" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-black/70">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
