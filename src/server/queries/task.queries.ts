import "server-only";
import { db } from "@/server/db";
import type { AppUser } from "@/lib/auth/guards";

export async function listTasks(actor: AppUser) {
  return db.task.findMany({
    where: { companyId: actor.companyId, deletedAt: null },
    include: {
      assignments: { include: { assignee: { select: { id: true, name: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(id: string, companyId: string) {
  return db.task.findFirst({
    where: { id, companyId },
    include: {
      assignments: { include: { assignee: { select: { id: true, name: true } } } },
      createdBy: { select: { name: true } },
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      activities: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      attachments: { include: { uploadedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listAssignableUsers(companyId: string) {
  return db.user.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
