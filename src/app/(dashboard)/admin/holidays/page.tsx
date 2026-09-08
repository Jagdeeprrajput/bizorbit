import { requirePermission } from "@/lib/auth/guards";
import { listHolidays } from "@/server/queries/organisation.queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HolidayFormDialog } from "./holiday-form-dialog";

const typeVariant: Record<string, "brand" | "secondary" | "outline"> = {
  PUBLIC: "brand",
  COMPANY: "secondary",
  OPTIONAL: "outline",
  RESTRICTED: "outline",
};

export default async function HolidaysPage() {
  const actor = await requirePermission("department.manage");
  const holidays = await listHolidays(actor.companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Holidays</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Excluded automatically from leave day counts.
          </p>
        </div>
        <HolidayFormDialog />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No holidays added for this year yet.
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(holiday.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[holiday.type]}>{holiday.type}</Badge>
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
