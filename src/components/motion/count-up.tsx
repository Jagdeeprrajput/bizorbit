"use client";

import * as React from "react";
import { animate, useMotionValue } from "motion/react";

const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function CountUp({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);

  React.useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${formatter.format(latest)}${suffix}`;
      }
    });
  }, [motionValue, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}
