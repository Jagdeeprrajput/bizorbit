"use client";

import { motion } from "motion/react";
import type { TargetHealth } from "@/server/services/sales.service";

const healthColor: Record<TargetHealth, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

const healthLabel: Record<TargetHealth, string> = {
  good: "On track",
  warning: "Falling behind",
  critical: "At risk",
};

// Semicircle gauge, 180° sweep. Radius/geometry chosen so the arc's stroke
// caps land cleanly at the 9 o'clock/3 o'clock endpoints.
const SIZE = 160;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = Math.PI * RADIUS;

export function TargetGauge({
  percent,
  health,
  label,
}: {
  percent: number;
  health: TargetHealth;
  label: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const dashOffset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const achieved = percent >= 100;

  return (
    <div className="flex flex-col items-center">
      <motion.svg
        width={SIZE}
        height={SIZE / 2 + STROKE}
        viewBox={`0 0 ${SIZE} ${SIZE / 2 + STROKE / 2}`}
        animate={achieved ? { scale: [1, 1.04, 1] } : {}}
        transition={achieved ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={achieved ? { filter: `drop-shadow(0 0 10px color-mix(in srgb, ${healthColor[health]} 55%, transparent))` } : undefined}
      >
        <path
          d={`M ${STROKE / 2} ${SIZE / 2} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${STROKE / 2} ${SIZE / 2} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`}
          fill="none"
          stroke={healthColor[health]}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 6}
          textAnchor="middle"
          className="fill-foreground font-mono text-2xl font-semibold"
        >
          {Math.round(percent)}%
        </text>
      </motion.svg>
      <p className="mt-1 text-sm font-medium" style={{ color: healthColor[health] }}>
        {healthLabel[health]}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
