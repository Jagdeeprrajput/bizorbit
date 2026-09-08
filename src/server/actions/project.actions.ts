"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission, requireAuth, type AppUser } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import {
  createProjectSchema,
  updateProjectSchema,
  postProjectUpdateSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type PostProjectUpdateInput,
  type projectStatuses,
} from "@/lib/validations/project";

type ActionResult = { success: true } | { success: false; error: string };

export async function createProject(input: CreateProjectInput): Promise<ActionResult> {
  const actor = await requirePermission("project.manage");
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await db.project.findFirst({ where: { companyId: actor.companyId, code: data.code } });
  if (existing) {
    return { success: false, error: "A project with that code already exists." };
  }

  await db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        companyId: actor.companyId,
        name: data.name,
        code: data.code,
        description: data.description,
        ownerId: data.ownerId,
        createdById: actor.id,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    const memberIds = new Set([data.ownerId, ...data.memberIds]);
    for (const userId of memberIds) {
      await tx.projectMember.create({
        data: {
          companyId: actor.companyId,
          projectId: project.id,
          userId,
          role: userId === data.ownerId ? "LEAD" : "MEMBER",
        },
      });
    }

    for (const userId of memberIds) {
      if (userId === actor.id) continue;
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId,
          category: "TASK_ASSIGNED",
          title: "Added to a project",
          body: `You're on "${project.name}" now.`,
          linkUrl: `/projects/${project.id}`,
        },
      });
    }

    await recordAudit(tx, {
      actor,
      action: "project.created",
      entityType: "Project",
      entityId: project.id,
      afterState: { name: project.name, code: project.code },
    });
  });

  revalidatePath("/projects");
  return { success: true };
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<ActionResult> {
  const actor = await requirePermission("project.manage");
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        ownerId: parsed.data.ownerId,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    if (parsed.data.ownerId !== project.ownerId) {
      const alreadyMember = await tx.projectMember.findFirst({
        where: { projectId, userId: parsed.data.ownerId },
      });
      if (!alreadyMember) {
        await tx.projectMember.create({
          data: { companyId: actor.companyId, projectId, userId: parsed.data.ownerId, role: "LEAD" },
        });
      } else {
        await tx.projectMember.update({ where: { id: alreadyMember.id }, data: { role: "LEAD" } });
      }
    }

    await recordAudit(tx, {
      actor,
      action: "project.updated",
      entityType: "Project",
      entityId: projectId,
      beforeState: { name: project.name },
      afterState: { name: parsed.data.name },
    });
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateProjectStatus(
  projectId: string,
  status: (typeof projectStatuses)[number],
): Promise<ActionResult> {
  const actor = await requirePermission("project.manage");

  const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.project.update({ where: { id: projectId }, data: { status } });
    await recordAudit(tx, {
      actor,
      action: "project.status_changed",
      entityType: "Project",
      entityId: projectId,
      beforeState: { status: project.status },
      afterState: { status },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}

export async function postProjectUpdate(input: PostProjectUpdateInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = postProjectUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const membership = await db.projectMember.findFirst({
    where: { projectId: parsed.data.projectId, userId: actor.id },
  });
  if (!membership) {
    return { success: false, error: "You're not on this project." };
  }

  await db.$transaction(async (tx) => {
    await tx.projectUpdate.create({
      data: {
        companyId: actor.companyId,
        projectId: parsed.data.projectId,
        authorId: actor.id,
        status: parsed.data.status,
        body: parsed.data.body,
      },
    });
    await tx.project.update({ where: { id: parsed.data.projectId }, data: { status: parsed.data.status } });
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function addProjectMember(projectId: string, userId: string): Promise<ActionResult> {
  const actor = await requirePermission("project.manage");

  const existing = await db.projectMember.findFirst({ where: { projectId, userId } });
  if (existing) {
    return { success: false, error: "Already on this project." };
  }

  await db.$transaction(async (tx) => {
    await tx.projectMember.create({
      data: { companyId: actor.companyId, projectId, userId, role: "MEMBER" },
    });
    await tx.notification.create({
      data: {
        companyId: actor.companyId,
        userId,
        category: "TASK_ASSIGNED",
        title: "Added to a project",
        body: "You've been added to a project.",
        linkUrl: `/projects/${projectId}`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectMember(projectId: string, userId: string): Promise<ActionResult> {
  await requirePermission("project.manage");
  await db.projectMember.deleteMany({ where: { projectId, userId } });
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
