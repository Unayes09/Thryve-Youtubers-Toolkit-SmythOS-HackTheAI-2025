"use client";
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { Demo } from "../components/landing/Demo";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Testimonials } from "../components/landing/Testimonials";
import { Pricing } from "../components/landing/Pricing";
import { Footer } from "../components/landing/Footer";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-orange-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-100/10 to-pink-100/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <motion.main
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <motion.div variants={fadeUp}>
          <Hero />
        </motion.div>

        <motion.div variants={fadeUp} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/50 to-transparent" />
          <Features />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Demo />
        </motion.div>

        <motion.div variants={fadeUp} className="relative">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-50/30 to-transparent" />
          <HowItWorks />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Testimonials />
        </motion.div>

        <motion.div variants={fadeUp} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/40 to-transparent" />
          <Pricing />
        </motion.div>
      </motion.main>

      <motion.div variants={fadeUp}>
        <Footer />
      </motion.div>
    </div>
  );
}
