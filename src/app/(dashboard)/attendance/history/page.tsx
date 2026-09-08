import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listOwnHistory, listPendingRegularisations } from "@/server/queries/attendance.queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegularisationDialog } from "./regularisation-dialog";
import { PendingRegularisations } from "./pending-regularisations";

const statusVariant: Record<string, "success" | "warning" | "critical" | "outline"> = {
  PRESENT: "success",
  HALF_DAY: "warning",
  ABSENT: "critical",
  ON_LEAVE: "outline",
  HOLIDAY: "outline",
  WEEKEND: "outline",
  PENDING_REGULARISATION: "critical",
};

function fmtTime(date: Date | null) {
  return date ? new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default async function AttendanceHistoryPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canApprove = hasPermission(actor.role, "attendance.regularise");
  const [records, pending] = await Promise.all([
    listOwnHistory(actor),
    canApprove ? listPendingRegularisations(actor) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Attendance history</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your last 30 recorded days.</p>

      {canApprove && (
        <div className="mt-8">
          <PendingRegularisations records={pending} />
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>In</TableHead>
              <TableHead>Out</TableHead>
              <TableHead>Net hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No attendance recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.workDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{fmtTime(record.clockInAt)}</TableCell>
                  <TableCell className="font-mono text-sm">{fmtTime(record.clockOutAt)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.netWorkMinutes != null ? (record.netWorkMinutes / 60).toFixed(1) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[record.status] ?? "secondary"}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.isLate && <Badge variant="outline" className="mr-1">Late</Badge>}
                    {record.isFlagged && <Badge variant="destructive">Flagged</Badge>}
                  </TableCell>
                  <TableCell>
                    {(record.isFlagged || record.status === "PENDING_REGULARISATION") &&
                      record.status !== "ON_LEAVE" && <RegularisationDialog attendanceRecordId={record.id} />}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
