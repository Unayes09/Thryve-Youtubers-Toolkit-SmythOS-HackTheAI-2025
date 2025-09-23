"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { inViewProps, fadeUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Demo() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const run = async () => {
    setLoading(true);
    setResults([]);
    await new Promise((r) => setTimeout(r, 800));
    setResults(["Video list fetched", "Transcripts parsed", "Ideas generated"]);
    setLoading(false);
  };

  return (
    <section id="demo" className="py-20 sm:py-28 bg-black/[.03]">
      <div className="mx-auto container px-4">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: "#2d2d2b" }}>
              Try it live
            </h2>
            <p className="text-black/70">
              Enter a YouTube handle. We will mock the flow.
            </p>
          </div>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          variants={staggerContainer(0.05)}
          {...inViewProps}
        >
          <Input
            placeholder="@yourchannel"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <Button
            onClick={run}
            disabled={!handle || loading}
            style={{ backgroundColor: "#ec9347" }}
          >
            {loading ? "Fetching..." : "Fetch"}
          </Button>
        </motion.div>

        <motion.div
          className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[120px]"
          {...inViewProps}
          variants={staggerContainer(0.06)}
        >
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-md bg-white shadow-sm border border-black/10 p-4 animate-pulse"
              />
            ))}
          {!loading &&
            results.map((r) => (
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-24 rounded-md bg-white shadow-sm border border-black/10 p-4"
              >
                <p className="font-medium" style={{ color: "#2d2d2b" }}>
                  {r}
                </p>
                <p className="text-sm text-black/70">Mock response</p>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
