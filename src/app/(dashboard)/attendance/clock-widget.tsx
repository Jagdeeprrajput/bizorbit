"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { clockIn, clockOut, startBreak, endBreak } from "@/server/actions/attendance.actions";

type Record = {
  clockInAt: Date | null;
  clockOutAt: Date | null;
  clockInWithinGeofence: boolean | null;
  clockInDistanceMeters: unknown;
  breakSessions: { id: string; endedAt: Date | null }[];
} | null;

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser doesn't support geolocation."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });
}

export function ClockWidget({ record }: { record: Record }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [acquiringLocation, setAcquiringLocation] = React.useState(false);

  const openBreak = record?.breakSessions.find((b) => !b.endedAt);
  const hasClockIn = Boolean(record?.clockInAt);
  const hasClockOut = Boolean(record?.clockOutAt);

  async function withLocation(action: (coords: { latitude: number; longitude: number; accuracyMeters: number }) => Promise<{ success: boolean; error?: string }>) {
    setAcquiringLocation(true);
    try {
      const position = await getPosition();
      setAcquiringLocation(false);
      startTransition(async () => {
        const result = await action({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
        if (!result.success) {
          toast.error(result.error ?? "Something went wrong");
          return;
        }
        router.refresh();
      });
    } catch {
      setAcquiringLocation(false);
      toast.error("Couldn't get your location. Check browser permissions and try again.");
    }
  }

  const busy = pending || acquiringLocation;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <p className="text-sm font-medium">Today</p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {record && (
          <Badge variant={record.clockInWithinGeofence ? "secondary" : "destructive"} className="gap-1">
            <MapPin className="size-3" />
            {record.clockInWithinGeofence === false ? "Outside geofence" : "Within geofence"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4 text-center font-mono">
          <div>
            <div className="text-xs text-muted-foreground">Clock in</div>
            <div className="text-lg font-semibold">
              {record?.clockInAt ? new Date(record.clockInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Clock out</div>
            <div className="text-lg font-semibold">
              {record?.clockOutAt ? new Date(record.clockOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          </div>
        </div>

        {!hasClockIn && (
          <Button className="w-full" size="lg" disabled={busy} onClick={() => withLocation(clockIn)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            Clock in
          </Button>
        )}

        {hasClockIn && !hasClockOut && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => startTransition(async () => {
                const result = openBreak ? await endBreak() : await startBreak();
                if (!result.success) toast.error(result.error ?? "Something went wrong");
                else router.refresh();
              })}
            >
              <Coffee className="size-4" />
              {openBreak ? "End break" : "Start break"}
            </Button>
            <Button disabled={busy} onClick={() => withLocation(clockOut)}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              Clock out
            </Button>
          </div>
        )}

        {hasClockOut && (
          <p className="text-center text-sm text-muted-foreground">You&apos;re done for today.</p>
        )}
      </CardContent>
    </Card>
  );
}
