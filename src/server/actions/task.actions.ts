"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireAuth, requirePermission, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { recordAudit } from "@/server/services/audit.service";
import {
  createTaskSchema,
  updateTaskSchema,
  taskStatuses,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/validations/task";
import {
  saveUploadedFile,
  deleteUploadedFile,
  FileValidationError,
} from "@/server/services/file-storage.service";

type ActionResult = { success: true } | { success: false; error: string };

export async function createTask(input: CreateTaskInput): Promise<ActionResult> {
  const actor = await requirePermission("task.create");
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const assigneeIds = parsed.data.assigneeIds.length > 0 ? parsed.data.assigneeIds : [actor.id];

  await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        companyId: actor.companyId,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        createdById: actor.id,
        projectId: parsed.data.projectId || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: "TODO",
      },
    });

    await tx.taskActivity.create({
      data: { companyId: actor.companyId, taskId: task.id, actorId: actor.id, type: "CREATED" },
    });

    for (const [index, assigneeId] of assigneeIds.entries()) {
      await tx.taskAssignment.create({
        data: {
          companyId: actor.companyId,
          taskId: task.id,
          assigneeId,
          assignedById: actor.id,
          isPrimary: index === 0,
        },
      });
      await tx.taskActivity.create({
        data: { companyId: actor.companyId, taskId: task.id, actorId: actor.id, type: "ASSIGNED", toValue: assigneeId },
      });

      if (assigneeId !== actor.id) {
        await tx.notification.create({
          data: {
            companyId: actor.companyId,
            userId: assigneeId,
            category: "TASK_ASSIGNED",
            title: "New task assigned to you",
            body: task.title,
            linkUrl: `/tasks/${task.id}`,
          },
        });
      }
    }

    await recordAudit(tx, {
      actor,
      action: "task.created",
      entityType: "Task",
      entityId: task.id,
      afterState: { title: task.title, assigneeCount: assigneeIds.length },
    });
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status: (typeof taskStatuses)[number],
): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const task = await db.task.findFirst({ where: { id: taskId, companyId: actor.companyId } });
  if (!task) {
    return { success: false, error: "Task not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { status, completedAt: status === "DONE" ? new Date() : null },
    });
    await tx.taskActivity.create({
      data: {
        companyId: actor.companyId,
        taskId,
        actorId: actor.id,
        type: "STATUS_CHANGED",
        fromValue: task.status,
        toValue: status,
      },
    });
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const task = await db.task.findFirst({
    where: { id: taskId, companyId: actor.companyId, deletedAt: null },
    include: { assignments: true },
  });
  if (!task) {
    return { success: false, error: "Task not found." };
  }
  if (task.createdById !== actor.id && !hasPermission(actor.role, "task.assign")) {
    return { success: false, error: "You can't edit this task." };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const newAssigneeIds = parsed.data.assigneeIds.length > 0 ? parsed.data.assigneeIds : [actor.id];
  const currentAssigneeIds = task.assignments.map((a) => a.assigneeId);
  const added = newAssigneeIds.filter((id) => !currentAssigneeIds.includes(id));
  const removed = currentAssigneeIds.filter((id) => !newAssigneeIds.includes(id));
  const newDueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        dueDate: newDueDate,
      },
    });

    if (parsed.data.priority !== task.priority) {
      await tx.taskActivity.create({
        data: {
          companyId: actor.companyId,
          taskId,
          actorId: actor.id,
          type: "PRIORITY_CHANGED",
          fromValue: task.priority,
          toValue: parsed.data.priority,
        },
      });
    }

    const oldDueDate = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null;
    const newDueDateStr = newDueDate ? newDueDate.toISOString().slice(0, 10) : null;
    if (oldDueDate !== newDueDateStr) {
      await tx.taskActivity.create({
        data: {
          companyId: actor.companyId,
          taskId,
          actorId: actor.id,
          type: "DUE_DATE_CHANGED",
          fromValue: oldDueDate,
          toValue: newDueDateStr,
        },
      });
    }

    for (const assigneeId of removed) {
      await tx.taskAssignment.deleteMany({ where: { taskId, assigneeId } });
      await tx.taskActivity.create({
        data: { companyId: actor.companyId, taskId, actorId: actor.id, type: "UNASSIGNED", toValue: assigneeId },
      });
    }

    for (const [index, assigneeId] of added.entries()) {
      await tx.taskAssignment.create({
        data: {
          companyId: actor.companyId,
          taskId,
          assigneeId,
          assignedById: actor.id,
          isPrimary: currentAssigneeIds.length === 0 && index === 0,
        },
      });
      await tx.taskActivity.create({
        data: { companyId: actor.companyId, taskId, actorId: actor.id, type: "ASSIGNED", toValue: assigneeId },
      });
      if (assigneeId !== actor.id) {
        await tx.notification.create({
          data: {
            companyId: actor.companyId,
            userId: assigneeId,
            category: "TASK_ASSIGNED",
            title: "You were assigned to a task",
            body: parsed.data.title,
            linkUrl: `/tasks/${taskId}`,
          },
        });
      }
    }

    await recordAudit(tx, {
      actor,
      action: "task.updated",
      entityType: "Task",
      entityId: taskId,
      beforeState: { title: task.title, priority: task.priority },
      afterState: { title: parsed.data.title, priority: parsed.data.priority },
    });
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const task = await db.task.findFirst({ where: { id: taskId, companyId: actor.companyId, deletedAt: null } });
  if (!task) {
    return { success: false, error: "Task not found." };
  }
  if (task.createdById !== actor.id && !hasPermission(actor.role, "task.assign")) {
    return { success: false, error: "You can't delete this task." };
  }

  await db.$transaction(async (tx) => {
    await tx.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
    await recordAudit(tx, {
      actor,
      action: "task.deleted",
      entityType: "Task",
      entityId: taskId,
      beforeState: { title: task.title },
    });
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function addTaskAttachment(taskId: string, formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const task = await db.task.findFirst({ where: { id: taskId, companyId: actor.companyId } });
  if (!task) {
    return { success: false, error: "Task not found." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  let saved;
  try {
    saved = await saveUploadedFile({ companyId: actor.companyId, scope: "tasks", scopeId: taskId, file });
  } catch (error) {
    if (error instanceof FileValidationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  await db.$transaction(async (tx) => {
    const attachment = await tx.taskAttachment.create({
      data: {
        companyId: actor.companyId,
        taskId,
        uploadedById: actor.id,
        fileName: saved.fileName,
        fileKey: saved.fileKey,
        fileUrl: "",
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
      },
    });
    await tx.taskAttachment.update({
      where: { id: attachment.id },
      data: { fileUrl: `/api/attachments/${attachment.id}` },
    });
    await tx.taskActivity.create({
      data: { companyId: actor.companyId, taskId, actorId: actor.id, type: "ATTACHMENT_ADDED", toValue: saved.fileName },
    });
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTaskAttachment(attachmentId: string): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const attachment = await db.taskAttachment.findFirst({
    where: { id: attachmentId, companyId: actor.companyId },
    include: { task: { select: { id: true, createdById: true } } },
  });
  if (!attachment) {
    return { success: false, error: "Attachment not found." };
  }

  const canDelete =
    attachment.uploadedById === actor.id ||
    attachment.task?.createdById === actor.id ||
    actor.role === "SUPER_ADMIN" ||
    actor.role === "HR";
  if (!canDelete) {
    return { success: false, error: "You can't remove this attachment." };
  }

  await db.taskAttachment.delete({ where: { id: attachmentId } });
  await deleteUploadedFile(attachment.fileKey);

  if (attachment.taskId) {
    revalidatePath(`/tasks/${attachment.taskId}`);
  }
  return { success: true };
}

export async function addTaskComment(taskId: string, body: string): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  if (!body.trim()) {
    return { success: false, error: "Comment can't be empty." };
  }

  await db.$transaction(async (tx) => {
    await tx.taskComment.create({
      data: { companyId: actor.companyId, taskId, authorId: actor.id, body },
    });
    await tx.taskActivity.create({
      data: { companyId: actor.companyId, taskId, actorId: actor.id, type: "COMMENTED" },
    });
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}
