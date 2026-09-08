import "server-only";
import { db } from "@/server/db";
import { requirePermission } from "@/lib/auth/guards";

export async function listEmployees() {
  const actor = await requirePermission("employee.read");

  return db.user.findMany({
    where: { companyId: actor.companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      employeeCode: true,
      role: true,
      status: true,
      avatarUrl: true,
      department: { select: { name: true } },
      designation: { select: { title: true } },
      manager: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmployeeById(id: string) {
  const actor = await requirePermission("employee.read");

  return db.user.findFirst({
    where: { id, companyId: actor.companyId, deletedAt: null },
    include: {
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      manager: { select: { id: true, name: true } },
      primaryOffice: { select: { id: true, name: true } },
      directReports: { select: { id: true, name: true, employeeCode: true } },
    },
  });
}

export async function listManagerCandidates(companyId: string) {
  return db.user.findMany({
    where: { companyId, deletedAt: null, status: { not: "OFFBOARDED" } },
    select: { id: true, name: true, employeeCode: true },
    orderBy: { name: "asc" },
  });
}
