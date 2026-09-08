"use client";

import * as React from "react";
import { motion } from "motion/react";

type Segment = { label: string; value: number; color: string };

const SIZE = 160;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth={STROKE} />
          {total > 0 &&
            segments
              .filter((s) => s.value > 0)
              .map((segment, index) => {
                const fraction = segment.value / total;
                const dash = fraction * CIRCUMFERENCE;
                const gap = CIRCUMFERENCE - dash;
                const offset = -cumulative * CIRCUMFERENCE;
                cumulative += fraction;
                return (
                  <motion.circle
                    key={segment.label}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${gap}`}
                    initial={{ strokeDashoffset: 0, opacity: 0 }}
                    animate={{ strokeDashoffset: offset, opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold">{centerValue}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-1.5 sm:w-auto">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="flex-1 text-muted-foreground">{segment.label}</span>
            <span className="font-mono font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
