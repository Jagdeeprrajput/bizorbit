"use client";

import * as React from "react";
import { motion } from "motion/react";
import { MapPin, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Illustrative-only preview of the clock-in widget from the Attendance module.
// Not wired to real data — the ticking clock is the one live thing on it.
export function ClockWidgetPreview() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-sm"
    >
      <Card className="border-border/80 shadow-xl shadow-brand-900/5">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <p className="text-sm font-medium">Priya · Engineering</p>
            <p className="text-xs text-muted-foreground">Head Office · Bengaluru</p>
          </div>
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted px-4 py-6 text-center font-mono">
            <div className="text-4xl font-semibold tabular-nums">
              {now
                ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "--:--:--"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {now ? now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }) : ""}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />
              42m from office
            </Badge>
            <Badge variant="secondary" className="gap-1 text-emerald-700 dark:text-emerald-400">
              <Wifi className="size-3" />
              Within geofence
            </Badge>
          </div>

          <Button className="w-full" size="lg" disabled>
            Clock in
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Preview only — sign in to use the real widget
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
