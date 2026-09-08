import "server-only";
import { db } from "@/server/db";
import type { AppUser } from "@/lib/auth/guards";

export async function listLeaveTypes(companyId: string) {
  return db.leaveType.findMany({ where: { companyId, isActive: true }, orderBy: { name: "asc" } });
}

export async function listLeaveTypesForAdmin(companyId: string) {
  return db.leaveType.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function listOwnBalances(actor: AppUser) {
  const year = new Date().getUTCFullYear();
  const leaveTypes = await listLeaveTypes(actor.companyId);
  const balances = await db.leaveBalance.findMany({
    where: { userId: actor.id, year },
  });

  return leaveTypes.map((type) => {
    const balance = balances.find((b) => b.leaveTypeId === type.id);
    const allocated = Number(balance?.allocatedDays ?? type.annualQuotaDays);
    const carried = Number(balance?.carriedForwardDays ?? 0);
    const used = Number(balance?.usedDays ?? 0);
    const pending = Number(balance?.pendingDays ?? 0);
    return {
      leaveType: type,
      allocated,
      carried,
      used,
      pending,
      available: allocated + carried - used - pending,
    };
  });
}

export async function listOwnLeaveRequests(actor: AppUser) {
  return db.leaveRequest.findMany({
    where: { userId: actor.id },
    include: { leaveType: true, approvals: { orderBy: { stage: "asc" }, include: { approver: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingApprovalsForMe(actor: AppUser) {
  // Fetched broadly (anyone whose approval row is still PENDING at any
  // stage) then narrowed in JS to "it's actually this approver's turn" —
  // Prisma can't compare a request's currentApprovalStage against its own
  // nested approval row's stage in a single relational filter.
  const candidates = await db.leaveRequest.findMany({
    where: {
      companyId: actor.companyId,
      status: "PENDING",
      approvals: { some: { approverId: actor.id, decision: "PENDING" } },
    },
    include: { leaveType: true, user: { select: { name: true, employeeCode: true } }, approvals: true },
    orderBy: { appliedAt: "asc" },
  });

  return candidates.filter((request) =>
    request.approvals.some((a) => a.approverId === actor.id && a.stage === request.currentApprovalStage),
  );
}
