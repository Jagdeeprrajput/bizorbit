import "server-only";
import { db } from "@/server/db";
import { scopeFilter, type AppUser } from "@/lib/auth/guards";

/** Turns a scopeFilter() result into a where clause against the User table (id/companyId, not userId). */
function scopeFilterToUserWhere(filter: { userId?: { in: string[] } | string; companyId?: string }) {
  if (filter.companyId) return { companyId: filter.companyId };
  if (typeof filter.userId === "string") return { id: filter.userId };
  return { id: { in: filter.userId!.in } };
}

export async function getAttendanceReport(actor: AppUser, startDate: Date, endDate: Date) {
  const filter = await scopeFilter(actor, "attendance.read");
  if (!filter) return [];

  const employees = await db.user.findMany({
    where: { ...scopeFilterToUserWhere(filter), deletedAt: null, status: { not: "OFFBOARDED" } },
    select: { id: true, name: true, employeeCode: true },
    orderBy: { name: "asc" },
  });

  const records = await db.attendanceRecord.findMany({
    where: {
      workDate: { gte: startDate, lte: endDate },
      ...(filter.companyId ? { companyId: filter.companyId } : { userId: filter.userId }),
    },
  });

  type Stats = {
    presentDays: number;
    halfDays: number;
    absentDays: number;
    onLeaveDays: number;
    lateCount: number;
    totalNetMinutes: number;
    recordedDays: number;
  };
  const statsByUser = new Map<string, Stats>();

  for (const record of records) {
    const existing = statsByUser.get(record.userId) ?? {
      presentDays: 0,
      halfDays: 0,
      absentDays: 0,
      onLeaveDays: 0,
      lateCount: 0,
      totalNetMinutes: 0,
      recordedDays: 0,
    };
    existing.recordedDays += 1;
    if (record.status === "PRESENT") existing.presentDays += 1;
    if (record.status === "HALF_DAY") existing.halfDays += 1;
    if (record.status === "ABSENT") existing.absentDays += 1;
    if (record.status === "ON_LEAVE") existing.onLeaveDays += 1;
    if (record.isLate) existing.lateCount += 1;
    existing.totalNetMinutes += record.netWorkMinutes ?? 0;
    statsByUser.set(record.userId, existing);
  }

  return employees
    .map((employee) => {
      const stats = statsByUser.get(employee.id);
      return {
        name: employee.name,
        employeeCode: employee.employeeCode,
        presentDays: stats?.presentDays ?? 0,
        halfDays: stats?.halfDays ?? 0,
        absentDays: stats?.absentDays ?? 0,
        onLeaveDays: stats?.onLeaveDays ?? 0,
        lateCount: stats?.lateCount ?? 0,
        avgHoursPerDay: stats && stats.recordedDays > 0 ? stats.totalNetMinutes / stats.recordedDays / 60 : 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLeaveReport(actor: AppUser, startDate: Date, endDate: Date) {
  const filter = await scopeFilter(actor, "leave.approve");
  const effectiveFilter = filter ?? { userId: actor.id };

  const employees = await db.user.findMany({
    where: { ...scopeFilterToUserWhere(effectiveFilter), deletedAt: null, status: { not: "OFFBOARDED" } },
    select: { id: true, name: true, employeeCode: true },
    orderBy: { name: "asc" },
  });

  const requests = await db.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(effectiveFilter.companyId ? { companyId: effectiveFilter.companyId } : { userId: effectiveFilter.userId }),
    },
    include: { leaveType: { select: { name: true } } },
  });

  const byUser = new Map<string, { byType: Map<string, number>; totalDays: number }>();
  for (const request of requests) {
    const existing = byUser.get(request.userId) ?? { byType: new Map<string, number>(), totalDays: 0 };
    const days = Number(request.totalDays);
    existing.byType.set(request.leaveType.name, (existing.byType.get(request.leaveType.name) ?? 0) + days);
    existing.totalDays += days;
    byUser.set(request.userId, existing);
  }

  return employees
    .map((employee) => {
      const stats = byUser.get(employee.id);
      return {
        name: employee.name,
        employeeCode: employee.employeeCode,
        totalDays: stats?.totalDays ?? 0,
        byType: stats ? [...stats.byType.entries()].map(([type, days]) => ({ type, days })) : [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
