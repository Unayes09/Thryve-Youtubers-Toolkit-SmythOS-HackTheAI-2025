"use client";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, inViewProps } from "@/lib/motion";

const steps = [
  { title: "Connect channel", desc: "Secure OAuth with your YouTube account." },
  {
    title: "Generate ideas & assets",
    desc: "AI drafts titles, scripts, thumbnails, reels.",
  },
  { title: "Publish & grow", desc: "Plan uploads and track performance." },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto container px-4">
        <h2
          className="text-3xl sm:text-4xl font-bold mb-8"
          style={{ color: "#2d2d2b" }}
        >
          How it works
        </h2>
        <motion.ol
          variants={staggerContainer(0.1)}
          {...inViewProps}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              variants={fadeUp}
              className="relative rounded-xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <span
                className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: "#ec9347" }}
              >
                {i + 1}
              </span>
              <h3 className="font-semibold mb-1" style={{ color: "#2d2d2b" }}>
                {s.title}
              </h3>
              <p className="text-black/70 text-sm">{s.desc}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
