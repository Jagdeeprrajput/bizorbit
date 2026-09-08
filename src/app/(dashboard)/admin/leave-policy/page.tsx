import { requirePermission } from "@/lib/auth/guards";
import { listLeaveTypesForAdmin } from "@/server/queries/leave.queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LeaveTypeFormDialog } from "./leave-type-form-dialog";
import { LeaveTypeActiveToggle } from "./leave-type-active-toggle";

export default async function LeavePolicyPage() {
  const actor = await requirePermission("leave.policy.manage");
  const leaveTypes = await listLeaveTypesForAdmin(actor.companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave types, annual quotas, and carry-forward rules — used to calculate every employee&apos;s balance.
          </p>
        </div>
        <LeaveTypeFormDialog />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {leaveTypes.length === 0 ? (
          <p className="col-span-2 py-10 text-center text-muted-foreground">
            No leave types yet — create your first one above.
          </p>
        ) : (
          leaveTypes.map((type) => (
            <Card key={type.id} className={!type.isActive ? "opacity-60" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: type.colorHex }} />
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    {!type.isActive && <Badge variant="secondary">Inactive</Badge>}
                    {!type.isPaid && <Badge variant="outline">Unpaid</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <LeaveTypeFormDialog leaveType={type} />
                    <LeaveTypeActiveToggle id={type.id} isActive={type.isActive} />
                  </div>
                </div>
                <CardDescription>
                  {Number(type.annualQuotaDays)} day(s)/year · {type.accrualMethod.replace("_", " ").toLowerCase()}
                  {type.allowCarryForward &&
                    ` · carries forward up to ${type.maxCarryForwardDays ? Number(type.maxCarryForwardDays) : "∞"} day(s)`}
                </CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {type.minNoticeDays > 0 ? `${type.minNoticeDays} day(s) notice required` : "No notice required"} ·{" "}
                  {type.maxConsecutiveDays ? `max ${type.maxConsecutiveDays} consecutive day(s)` : "no consecutive-day limit"}{" "}
                  · {type.allowHalfDay ? "half-day allowed" : "full-day only"}
                </p>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
