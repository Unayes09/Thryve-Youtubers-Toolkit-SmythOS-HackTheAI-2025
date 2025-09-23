"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

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

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec9347]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="md:hidden bg-white/95 backdrop-blur-sm border-t border-black/10"
        >
          <nav
            className="container mx-auto px-4 py-4 space-y-4"
            aria-label="Mobile navigation"
          >
            {[
              { href: "#features", label: "Features" },
              { href: "#demo", label: "Demo" },
              { href: "#pricing", label: "Pricing" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-3 px-2 text-base font-medium text-gray-900 hover:text-[#ec9347] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec9347] focus:ring-offset-2 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-black/10 space-y-3">
              <Link
                href="/sign-in"
                className="block w-full text-center px-4 py-3 rounded-full border border-black/10 hover:border-transparent bg-white hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec9347] focus:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block w-full text-center px-4 py-3 rounded-full text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#ec9347] focus:ring-offset-2"
                style={{ backgroundColor: "#ec9347" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started — Free
              </Link>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
