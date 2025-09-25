"use client";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setEmail("");
  };
  return (
    <footer className="border-t border-orange-100/50 bg-gradient-to-r from-slate-50/50 to-orange-50/30">
      <div className="mx-auto container px-4 py-16 grid md:grid-cols-3 gap-8">
        <div>
          <Image src="/logo.png" alt="Thryve" width={300} height={300} />
        </div>
        <nav className="grid grid-cols-2 gap-4 text-sm">
          <Link
            href="#features"
            className="hover:text-orange-600 hover:underline transition-colors duration-200 font-medium"
          >
            Features
          </Link>
          <Link
            href="#demo"
            className="hover:text-orange-600 hover:underline transition-colors duration-200 font-medium"
          >
            Demo
          </Link>
          <Link
            href="#pricing"
            className="hover:text-orange-600 hover:underline transition-colors duration-200 font-medium"
          >
            Pricing
          </Link>
          <Link
            href="#legal"
            className="hover:text-orange-600 hover:underline transition-colors duration-200 font-medium"
          >
            Legal
          </Link>
          <Link
            href="#privacy"
            className="hover:text-orange-600 hover:underline transition-colors duration-200 font-medium"
          >
            Privacy
          </Link>
        </nav>
        <form onSubmit={submit} className="flex gap-3">
          <Input
            type="email"
            required
            placeholder="Email for updates"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Subscribe
          </Button>
        </form>
      </div>
      <div className="text-center text-sm text-gray-500 py-6 border-t border-orange-100/30">
        © {new Date().getFullYear()} Thryve. All rights reserved.
      </div>
    </footer>
  );
}
