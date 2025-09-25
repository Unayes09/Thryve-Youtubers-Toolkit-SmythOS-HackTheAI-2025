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
      className={`sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-white/80 shadow-lg border-b border-orange-100/50"
          : "bg-white/50 shadow-sm"
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
          className="hidden md:flex items-center gap-8 text-sm font-medium"
        >
          {[
            { href: "#features", label: "Features" },
            { href: "#demo", label: "Demo" },
            { href: "#pricing", label: "Pricing" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative group focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 rounded-lg px-2 py-1 transition-all duration-200 hover:text-orange-600"
            >
              <span className="relative z-10 px-1">{item.label}</span>
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-gradient-to-r from-orange-400 to-orange-500 group-hover:w-full transition-all duration-300 ease-out" />
              <span className="absolute inset-0 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </a>
          ))}
          <Link
            href="/sign-in"
            className="px-6 py-2.5 rounded-full border border-gray-200 hover:border-orange-200 bg-white hover:bg-orange-50/50 transition-all duration-200 font-medium text-gray-700 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2.5 rounded-full text-white font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
          >
            Get Started — Free
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-orange-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2"
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
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden bg-white/95 backdrop-blur-md border-t border-orange-100/50 shadow-lg"
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
                className="block py-3 px-4 text-base font-medium text-gray-900 hover:text-orange-600 hover:bg-orange-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-orange-100/50 space-y-3">
              <Link
                href="/sign-in"
                className="block w-full text-center px-4 py-3 rounded-full border border-gray-200 hover:border-orange-200 bg-white hover:bg-orange-50/50 transition-all duration-200 font-medium text-gray-700 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block w-full text-center px-4 py-3 rounded-full text-white font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
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
