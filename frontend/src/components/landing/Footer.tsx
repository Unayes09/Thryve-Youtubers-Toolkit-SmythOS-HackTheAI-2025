"use client";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { inViewProps, fadeUp } from "@/lib/motion";
import Image from "next/image";

export function Footer() {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setEmail("");
  };
  return (
    <footer className="border-t border-black/10">
      <motion.div
        className="mx-auto container px-4 py-12 grid md:grid-cols-3 gap-8"
        {...inViewProps}
        variants={fadeUp}
      >
        <div>
          <Image src="/logo.png" alt="Thryve" width={300} height={300} />
        </div>
        <nav className="grid grid-cols-2 gap-4 text-sm">
          <a href="#features" className="hover:underline">
            Features
          </a>
          <a href="#demo" className="hover:underline">
            Demo
          </a>
          <a href="#pricing" className="hover:underline">
            Pricing
          </a>
          <a href="#legal" className="hover:underline">
            Legal
          </a>
          <a href="#privacy" className="hover:underline">
            Privacy
          </a>
        </nav>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            type="email"
            required
            placeholder="Email for updates"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" style={{ backgroundColor: "#ec9347" }}>
            Subscribe
          </Button>
        </form>
      </motion.div>
      <div className="text-center text-xs text-black/60 py-5">
        © {new Date().getFullYear()} Thryve. All rights reserved.
      </div>
    </footer>
  );
}
