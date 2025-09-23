"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { inViewProps, fadeUp, staggerContainer, hoverLift } from "@/lib/motion";

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["10 ideas/mo", "Basic thumbnails", "1 channel"],
  },
  {
    name: "Pro",
    price: "$19",
    popular: true,
    features: ["Unlimited ideas", "CTR predictor", "Reels builder"],
  },
  {
    name: "Pro+",
    price: "$49",
    features: ["Teams", "Competitor gaps", "Priority support"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-black/[.03]">
      <div className="mx-auto container px-4">
        <h2
          className="text-3xl sm:text-4xl font-bold text-center mb-12"
          style={{ color: "#2d2d2b" }}
        >
          Simple pricing
        </h2>
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={staggerContainer(0.08)}
          {...inViewProps}
        >
          {plans.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              initial="rest"
              whileHover="hover"
              animate="rest"
            >
              <Card
                key={p.name}
                className={`p-6 relative ${p.popular ? "ring-2" : ""}`}
                style={
                  p.popular
                    ? {
                        borderColor: "#ec9347",
                        boxShadow: "0 0 0 1px #ec9347 inset",
                      }
                    : {}
                }
              >
                {p.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-white"
                    style={{ backgroundColor: "#ec9347" }}
                  >
                    Most popular
                  </span>
                )}
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "#2d2d2b" }}
                >
                  {p.name}
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {p.price}
                  <span className="text-sm font-normal text-black/60">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  style={{ backgroundColor: "#ec9347" }}
                >
                  Start {p.name}
                </Button>
                {/* Stripe checkout hook placeholder: onClick => createCheckoutSession(plan) */}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
