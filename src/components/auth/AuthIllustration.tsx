"use client";
import { motion } from "framer-motion";

export function AuthIllustration() {
  return (
    <div className="relative h-40 w-full max-w-md mx-auto" aria-hidden>
      <motion.div
        className="absolute left-0 top-2 h-16 w-28 flex items-center justify-center rounded-xl border border-black/10 bg-primary/50 shadow-sm font-bold text-[#2d2d2b]"
        initial={{ y: 10, rotate: -6, opacity: 1 }}
        animate={{ y: [10, -4, 10], rotate: -6, opacity: 1 }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        CREATE
      </motion.div>
      <motion.div
        className="absolute left-22 top-10 h-20 w-36 flex items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm font-bold text-[#2d2d2b]"
        initial={{ y: -6, rotate: 3, opacity: 1 }}
        animate={{ y: [-6, 6, -6], rotate: 3, opacity: 1 }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      >
        GROW
      </motion.div>
      <motion.div
        className="absolute right-0 top-0 h-24 w-40 flex items-center justify-center rounded-xl border border-black/10 bg-[#2d2d2b]/50 shadow-sm font-bold text-[#2d2d2b]"
        initial={{ y: 8, rotate: 8, opacity: 1 }}
        animate={{ y: [8, -2, 8], rotate: 8, opacity: 1 }}
        transition={{
          duration: 3.0,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      >
        IMPACT
      </motion.div>
      <motion.div
        className="absolute inset-x-10 bottom-0 h-10 rounded-full bg-black/5 blur-xl"
        initial={{ opacity: 1 }}
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
