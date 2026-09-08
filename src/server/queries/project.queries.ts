import "server-only";
import { db } from "@/server/db";
import type { AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export async function listProjects(actor: AppUser) {
  const canSeeAll = hasPermission(actor.role, "project.manage");

  return db.project.findMany({
    where: {
      companyId: actor.companyId,
      deletedAt: null,
      ...(canSeeAll ? {} : { members: { some: { userId: actor.id } } }),
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true, tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(id: string, companyId: string) {
  return db.project.findFirst({
    where: { id, companyId },
    include: {
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true, employeeCode: true } } } },
      updates: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      tasks: {
        include: { assignments: { include: { assignee: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
