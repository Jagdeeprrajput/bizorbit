"use client";

import { motion } from "motion/react";

// Slow-drifting gradient blobs behind the hero. Decorative only — aria-hidden,
// and respects prefers-reduced-motion via the global CSS rule in globals.css.
export function HeroOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 size-[28rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/20"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 size-[32rem] rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-800/20"
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_70%)]" />
    </div>
  );
}
