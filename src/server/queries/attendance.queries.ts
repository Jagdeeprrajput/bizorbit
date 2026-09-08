import "server-only";
import { db } from "@/server/db";
import { workDateFor } from "@/server/services/working-hours.service";
import { scopeFilter, type AppUser } from "@/lib/auth/guards";

export async function getTodayRecord(actor: AppUser) {
  const workDate = workDateFor(new Date());
  return db.attendanceRecord.findUnique({
    where: { userId_workDate: { userId: actor.id, workDate } },
    include: { breakSessions: { orderBy: { startedAt: "desc" } }, clockInOffice: true },
  });
}

export async function listOwnHistory(actor: AppUser, take = 30) {
  return db.attendanceRecord.findMany({
    where: { userId: actor.id },
    orderBy: { workDate: "desc" },
    take,
    include: { clockInOffice: { select: { name: true } } },
  });
}

export async function listPendingRegularisations(actor: AppUser) {
  const filter = await scopeFilter(actor, "attendance.regularise");
  if (!filter) return [];

  return db.attendanceRecord.findMany({
    where: { status: "PENDING_REGULARISATION", ...filter },
    include: { user: { select: { name: true, employeeCode: true } } },
    orderBy: { workDate: "desc" },
  });
}

export async function listAttendancePolicies(companyId: string) {
  return db.attendancePolicy.findMany({
    where: { companyId },
    include: { department: { select: { name: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
