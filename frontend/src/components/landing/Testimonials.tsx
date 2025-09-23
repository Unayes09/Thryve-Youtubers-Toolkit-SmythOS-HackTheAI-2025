"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { inViewProps, scaleIn } from "@/lib/motion";

const testimonials = [
  { quote: "+18% avg CTR in 2 weeks.", name: "Alex", role: "Creator" },
  { quote: "Cut ideation time by 70%.", name: "Maya", role: "Vlogger" },
  { quote: "Our reels now drive 3x subs.", name: "Dee", role: "Studio" },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % testimonials.length),
      3500
    );
    return () => clearInterval(id);
  }, []);

  const t = testimonials[index];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold mb-6" style={{ color: "#2d2d2b" }}>
          Loved by creators
        </h2>
        <motion.div
          className="relative h-32"
          {...inViewProps}
          variants={scaleIn}
        >
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0"
            >
              <blockquote className="text-xl">“{t.quote}”</blockquote>
              <figcaption className="mt-2 text-sm text-black/70">
                {t.name} — {t.role}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
