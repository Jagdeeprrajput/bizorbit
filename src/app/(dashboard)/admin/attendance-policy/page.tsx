import { requirePermission } from "@/lib/auth/guards";
import { listAttendancePolicies } from "@/server/queries/attendance.queries";
import { listDepartments } from "@/server/queries/organisation.queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PolicyFormDialog } from "./policy-form-dialog";

export default async function AttendancePolicyPage() {
  const actor = await requirePermission("settings.manage");
  const [policies, departments] = await Promise.all([
    listAttendancePolicies(actor.companyId),
    listDepartments(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance policies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shift times, grace period, and geofence rules — used on every clock-in.
          </p>
        </div>
        <PolicyFormDialog departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {policies.length === 0 ? (
          <p className="col-span-2 py-10 text-center text-muted-foreground">
            No policy configured yet — clock-ins use a 9:00–18:00 fallback until you add one.
          </p>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{policy.name}</CardTitle>
                  {policy.isDefault && <Badge>Default</Badge>}
                  {policy.department && <Badge variant="secondary">{policy.department.name} only</Badge>}
                </div>
                <CardDescription>
                  {policy.shiftStartTime}–{policy.shiftEndTime} · {policy.graceMinutes}m grace ·{" "}
                  {policy.workingDays.length} working day(s)
                </CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  Full day ≥ {(policy.minFullDayMinutes / 60).toFixed(1)}h · Half day ≥{" "}
                  {(policy.minHalfDayMinutes / 60).toFixed(1)}h ·{" "}
                  {policy.requireGeofence ? "Geofence required" : "Geofence optional"}
                </p>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
