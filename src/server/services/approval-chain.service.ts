import "server-only";
import { db } from "@/server/db";
import type { Role } from "@/lib/auth/permissions";

type ChainStage = { approverId: string; role: Role };

async function firstUserWithRole(companyId: string, role: Role, excludeUserId: string) {
  return db.user.findFirst({
    where: { companyId, role, status: "ACTIVE", id: { not: excludeUserId } },
    select: { id: true, role: true },
  });
}

/**
 * Builds the approval chain per §10.2, written to the database at submission
 * time so it can never silently change under an in-flight request. An empty
 * result means auto-approve (CEO / Super Admin applying for their own leave).
 */
export async function buildLeaveApprovalChain(requester: {
  id: string;
  companyId: string;
  role: Role;
  managerId: string | null;
}, totalDays: number): Promise<ChainStage[]> {
  const stages: ChainStage[] = [];

  if (requester.role === "CEO" || requester.role === "SUPER_ADMIN") {
    return stages; // auto-approved, still logged by the caller
  }

  if (requester.role === "EMPLOYEE" || requester.role === "MANAGER") {
    if (requester.managerId) {
      const manager = await db.user.findUnique({
        where: { id: requester.managerId },
        select: { id: true, role: true },
      });
      if (manager) stages.push({ approverId: manager.id, role: manager.role });
    }
    const hr = await firstUserWithRole(requester.companyId, "HR", requester.id);
    if (hr) stages.push({ approverId: hr.id, role: "HR" });
  } else if (requester.role === "HR" || requester.role === "CTO") {
    const ceo = await firstUserWithRole(requester.companyId, "CEO", requester.id);
    if (ceo) stages.push({ approverId: ceo.id, role: "CEO" });
  }

  // Escalation: long leave gets a final CEO sign-off (§10.2).
  const alreadyHasCeo = stages.some((s) => s.role === "CEO");
  if (totalDays > 5 && !alreadyHasCeo) {
    const ceo = await firstUserWithRole(requester.companyId, "CEO", requester.id);
    if (ceo) stages.push({ approverId: ceo.id, role: "CEO" });
  }

  // Nobody staffed to approve (e.g. a lone Super Admin testing the system) —
  // fall back to Super Admin so the request doesn't dead-end.
  if (stages.length === 0) {
    const superAdmin = await firstUserWithRole(requester.companyId, "SUPER_ADMIN", requester.id);
    if (superAdmin) stages.push({ approverId: superAdmin.id, role: "SUPER_ADMIN" });
  }

  return stages;
}

/** Excludes Saturdays, Sundays, and any date in `holidayDates` (§10.6). */
export function countWorkingDays(start: Date, end: Date, holidayDates: Set<string> = new Set()): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    const isHoliday = holidayDates.has(cursor.toISOString().slice(0, 10));
    if (day !== 0 && day !== 6 && !isHoliday) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
