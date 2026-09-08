"use client";

import { motion } from "motion/react";

// template.tsx (unlike layout.tsx) remounts on every navigation within this
// route group, so this component's mount animation re-triggers on each page
// change — a lightweight page-transition without needing AnimatePresence.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
