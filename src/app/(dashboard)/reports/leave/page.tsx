import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { getLeaveReport } from "@/server/queries/reports.queries";
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

function yearBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function LeaveReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const params = await searchParams;
  const defaults = yearBounds();
  const start = params.start || defaults.start;
  const end = params.end || defaults.end;

  const rows = await getLeaveReport(actor, new Date(start), new Date(end));

  const csvRows = rows.map((r) => ({
    Name: r.name,
    "Employee Code": r.employeeCode,
    "Total Days": r.totalDays,
    Breakdown: r.byType.map((b) => `${b.type}: ${b.days}`).join("; "),
  }));

  const pdfColumns = ["Name", "Employee Code", "Breakdown", "Total Days"];
  const pdfRows = rows.map((r) => [
    r.name,
    r.employeeCode,
    r.byType.map((b) => `${b.type}: ${b.days}`).join(", "),
    r.totalDays,
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Leave report</h1>
        <div className="flex gap-2">
          <ExportCsvButton rows={csvRows} filename={`leave-${start}-to-${end}.csv`} />
          <ExportPdfButton
            title="Leave report"
            subtitle={`${start} to ${end}`}
            columns={pdfColumns}
            rows={pdfRows}
            filename={`leave-${start}-to-${end}.pdf`}
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
              <TableHead>Breakdown</TableHead>
              <TableHead className="text-right">Total days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No approved leave in this range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.employeeCode}>
                  <TableCell className="font-medium">
                    {row.name} <span className="text-xs text-muted-foreground">· {row.employeeCode}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.byType.map((b) => `${b.type}: ${b.days}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.totalDays}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
