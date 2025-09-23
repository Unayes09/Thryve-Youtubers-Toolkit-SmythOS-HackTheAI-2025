"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={`sticky top-0 z-50 w-full backdrop-blur ${
        scrolled ? "bg-white/70 shadow-sm" : "bg-white/40"
      }`}
      aria-label="Primary"
    >
      <div className="mx-auto container px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Thryve home"
        >
          <Image
            src="/logo.png"
            alt="Thryve logo"
            width={200}
            height={200}
            priority
          />
        </Link>

        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-6 text-sm"
        >
          {[
            { href: "#features", label: "Features" },
            { href: "#demo", label: "Demo" },
            { href: "#pricing", label: "Pricing" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative group focus:outline-none"
            >
              <span className="px-1">{item.label}</span>
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#ec9347] group-hover:w-full transition-all duration-200" />
            </a>
          ))}
          <Link
            href="/sign-in"
            className="px-4 py-2 rounded-full border border-black/10 hover:border-transparent bg-white hover:bg-black/5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: "#ec9347" }}
          >
            Get Started — Free
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
