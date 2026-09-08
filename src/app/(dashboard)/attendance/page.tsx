import Link from "next/link";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { getTodayRecord } from "@/server/queries/attendance.queries";
import { Button } from "@/components/ui/button";
import { ClockWidget } from "./clock-widget";

export default async function AttendancePage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const record = await getTodayRecord(actor);

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/attendance/history">History</Link>
        </Button>
      </div>
      <ClockWidget record={record} />
      <p className="mt-4 text-center text-xs text-muted-foreground text-balance">
        GPS is evidence, not enforcement — punches outside the office radius are flagged
        for review, never blocked.
      </p>
    </div>
  );
}
