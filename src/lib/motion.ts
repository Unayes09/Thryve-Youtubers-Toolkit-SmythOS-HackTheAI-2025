import type { Variants } from "framer-motion";
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export const staggerContainer = (stagger: number = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
  hover: {
    y: -4,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    transition: { duration: 0.25 },
  },
};
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};
export const floatY: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
export const inViewProps = {
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, margin: "-80px" } as const,
};
