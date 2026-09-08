import "server-only";
import { db } from "@/server/db";
import { hasPermission } from "@/lib/auth/permissions";
import { scopeFilter, type AppUser } from "@/lib/auth/guards";
import { getTodayRecord } from "@/server/queries/attendance.queries";
import { listMyTargets } from "@/server/queries/sales.queries";
import { workDateFor } from "@/server/services/working-hours.service";

export async function getDashboardSummary(actor: AppUser) {
  const canApproveLeave = hasPermission(actor.role, "leave.approve");
  const canSeeTeam = hasPermission(actor.role, "employee.read") && actor.role !== "EMPLOYEE";

  const [todayAttendance, pendingLeaveCount, openTaskCount, teamCount, myTargets, notifications] =
    await Promise.all([
      getTodayRecord(actor),
      canApproveLeave
        ? db.leaveRequest.count({
            where: {
              companyId: actor.companyId,
              status: "PENDING",
              approvals: { some: { approverId: actor.id, decision: "PENDING" } },
            },
          })
        : db.leaveRequest.count({ where: { userId: actor.id, status: "PENDING" } }),
      db.taskAssignment.count({
        where: { assigneeId: actor.id, task: { status: { notIn: ["DONE", "CANCELLED"] } } },
      }),
      canSeeTeam
        ? (async () => {
            const filter = await scopeFilter(actor, "employee.read");
            if (!filter) return 0;
            return db.user.count({
              where: { deletedAt: null, status: { not: "OFFBOARDED" }, ...filter },
            });
          })()
        : Promise.resolve(null),
      listMyTargets(actor),
      db.notification.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const isClockedIn = Boolean(todayAttendance?.clockInAt) && !todayAttendance?.clockOutAt;
  const workDate = workDateFor(new Date());

  return {
    attendanceStatus: !todayAttendance?.clockInAt
      ? "not_clocked_in"
      : isClockedIn
        ? "clocked_in"
        : "clocked_out",
    canApproveLeave,
    pendingLeaveCount,
    openTaskCount,
    teamCount,
    primaryTarget: myTargets[0] ?? null,
    notifications,
    workDate,
  };
}
