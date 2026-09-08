import { requirePermission } from "@/lib/auth/guards";
import { listPendingApprovalsForMe } from "@/server/queries/leave.queries";
import { ApprovalActions } from "./approval-actions";

export default async function LeaveApprovalsPage() {
  const actor = await requirePermission("leave.approve");
  const requests = await listPendingApprovalsForMe(actor);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Leave approvals</h1>
      <p className="mt-1 text-sm text-muted-foreground">Requests waiting on your decision.</p>

      <div className="mt-8 space-y-3">
        {requests.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Nothing waiting on you right now.</p>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {request.user.name} <span className="text-muted-foreground">· {request.user.employeeCode}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.leaveType.name} ·{" "}
                  {new Date(request.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} –{" "}
                  {new Date(request.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} ·{" "}
                  {Number(request.totalDays)} day(s) · stage {request.currentApprovalStage}
                </p>
              </div>
              <ApprovalActions leaveRequestId={request.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
