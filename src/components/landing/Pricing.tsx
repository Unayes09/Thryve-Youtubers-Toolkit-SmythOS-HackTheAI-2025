"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { inViewProps, fadeUp, staggerContainer, hoverLift } from "@/lib/motion";
import { CREDIT_COSTS, CREDIT_COST_DESCRIPTIONS } from "@/lib/credit-costs";
import { Check, Zap, DollarSign, Clock } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    credits: 50,
    features: [
      "50 free credits",
      "Basic thumbnails",
      "1 channel",
      "Limited AI features",
    ],
  },
  {
    name: "Starter",
    price: "$9",
    credits: 200,
    popular: true,
    features: [
      "200 credits/month",
      "All AI features",
      "Unlimited channels",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    credits: 800,
    features: [
      "800 credits/month",
      "Priority processing",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "$99",
    credits: 3000,
    features: [
      "3000 credits/month",
      "Custom integrations",
      "Dedicated support",
      "Team collaboration",
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-28 bg-gradient-to-br from-slate-50/50 to-orange-50/30"
    >
      <div className="mx-auto container px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          {...inViewProps}
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: "#2d2d2b" }}
          >
            Simple, transparent{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Pay only for what you use with our credit-based system. No hidden
            fees, no surprises.
          </p>
        </motion.div>

        {/* Credit Demystification Section */}
        <motion.div className="mb-16" variants={fadeUp} {...inViewProps}>
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-orange-100/50 shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-full mb-4">
                <Zap className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-800">
                  How Credits Work
                </span>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: "#2d2d2b" }}
              >
                Every AI action costs credits
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Credits are consumed when you use AI-powered features. Think of
                them as tokens that power our AI to help you create amazing
                content.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(CREDIT_COSTS).map(([key, cost]) => (
                <motion.div
                  key={key}
                  className="p-4 rounded-lg bg-gradient-to-br from-orange-50/50 to-orange-100/30 border border-orange-100/50 hover:border-orange-200/50 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-orange-500 text-white text-xs">
                      {cost} credits
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {
                      CREDIT_COST_DESCRIPTIONS[
                        key as keyof typeof CREDIT_COST_DESCRIPTIONS
                      ]
                    }
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Pricing Plans */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
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
              className="group"
            >
              <Card
                className={`p-6 relative h-full transition-all duration-300 ${
                  p.popular
                    ? "ring-2 ring-orange-500/50 shadow-xl scale-105"
                    : "hover:shadow-lg hover:scale-102"
                }`}
                style={
                  p.popular
                    ? {
                        borderColor: "#ec9347",
                        boxShadow:
                          "0 0 0 1px #ec9347 inset, 0 20px 40px rgba(236, 147, 71, 0.1)",
                      }
                    : {}
                }
              >
                {p.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs text-white font-semibold"
                    style={{ backgroundColor: "#ec9347" }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="text-center mb-6">
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: "#2d2d2b" }}
                  >
                    {p.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /mo
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-200 px-3 py-1 rounded-full">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-800">
                      {p.credits} credits
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full transition-all duration-200 ${
                    p.popular
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {p.name === "Free" ? "Get Started" : `Start ${p.name}`}
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className="mt-16 text-center"
          variants={fadeUp}
          {...inViewProps}
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full mb-4">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Need more credits?
            </span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            You can always purchase additional credits at any time. Credits
            never expire, so you can use them whenever you need them.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
