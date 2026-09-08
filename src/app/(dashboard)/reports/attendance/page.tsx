import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { getAttendanceReport } from "@/server/queries/reports.queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeForm } from "../date-range-form";
import { ExportCsvButton } from "../export-csv-button";
import { ExportPdfButton } from "../export-pdf-button";

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const params = await searchParams;
  const defaults = monthBounds();
  const start = params.start || defaults.start;
  const end = params.end || defaults.end;

  const rows = await getAttendanceReport(actor, new Date(start), new Date(end));

  const csvRows = rows.map((r) => ({
    Name: r.name,
    "Employee Code": r.employeeCode,
    Present: r.presentDays,
    "Half Day": r.halfDays,
    Absent: r.absentDays,
    "On Leave": r.onLeaveDays,
    Late: r.lateCount,
    "Avg Hours/Day": r.avgHoursPerDay.toFixed(1),
  }));

  const pdfColumns = ["Name", "Employee Code", "Present", "Half Day", "Absent", "On Leave", "Late", "Avg Hrs/Day"];
  const pdfRows = rows.map((r) => [
    r.name,
    r.employeeCode,
    r.presentDays,
    r.halfDays,
    r.absentDays,
    r.onLeaveDays,
    r.lateCount,
    r.avgHoursPerDay.toFixed(1),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance report</h1>
        <div className="flex gap-2">
          <ExportCsvButton rows={csvRows} filename={`attendance-${start}-to-${end}.csv`} />
          <ExportPdfButton
            title="Attendance report"
            subtitle={`${start} to ${end}`}
            columns={pdfColumns}
            rows={pdfRows}
            filename={`attendance-${start}-to-${end}.pdf`}
          />
        </div>
      </div>

      <div className="mt-6">
        <DateRangeForm start={start} end={end} />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Half day</TableHead>
              <TableHead className="text-right">Absent</TableHead>
              <TableHead className="text-right">On leave</TableHead>
              <TableHead className="text-right">Late</TableHead>
              <TableHead className="text-right">Avg hrs/day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No attendance recorded in this range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.employeeCode}>
                  <TableCell className="font-medium">
                    {row.name} <span className="text-xs text-muted-foreground">· {row.employeeCode}</span>
                  </TableCell>
                  <TableCell className="text-right">{row.presentDays}</TableCell>
                  <TableCell className="text-right">{row.halfDays}</TableCell>
                  <TableCell className="text-right">{row.absentDays}</TableCell>
                  <TableCell className="text-right">{row.onLeaveDays}</TableCell>
                  <TableCell className="text-right">{row.lateCount}</TableCell>
                  <TableCell className="text-right font-mono">{row.avgHoursPerDay.toFixed(1)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
