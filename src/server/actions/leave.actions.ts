"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireAuth, requirePermission, type AppUser } from "@/lib/auth/guards";
import { buildLeaveApprovalChain, countWorkingDays } from "@/server/services/approval-chain.service";
import { recordAudit } from "@/server/services/audit.service";
import { applyLeaveSchema, createLeaveTypeSchema, type ApplyLeaveInput, type CreateLeaveTypeInput } from "@/lib/validations/leave";

type ActionResult = { success: true } | { success: false; error: string };

export async function createLeaveType(input: CreateLeaveTypeInput): Promise<ActionResult> {
  const actor = await requirePermission("leave.policy.manage");
  const parsed = createLeaveTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.leaveType.findFirst({
    where: { companyId: actor.companyId, code: parsed.data.code },
  });
  if (existing) {
    return { success: false, error: "A leave type with that code already exists." };
  }

  const { allowCarryForward, maxCarryForwardDays, requiresDocumentAfterDays, maxConsecutiveDays, ...rest } =
    parsed.data;

  const created = await db.$transaction(async (tx) => {
    const type = await tx.leaveType.create({
      data: {
        companyId: actor.companyId,
        ...rest,
        allowCarryForward,
        maxCarryForwardDays: allowCarryForward && maxCarryForwardDays > 0 ? maxCarryForwardDays : null,
        requiresDocumentAfterDays: requiresDocumentAfterDays > 0 ? requiresDocumentAfterDays : null,
        maxConsecutiveDays: maxConsecutiveDays > 0 ? maxConsecutiveDays : null,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "leave_type.created",
      entityType: "LeaveType",
      entityId: type.id,
      afterState: { name: type.name, code: type.code, annualQuotaDays: rest.annualQuotaDays },
    });
    return type;
  });

  revalidatePath("/admin/leave-policy");
  return created ? { success: true } : { success: false, error: "Something went wrong." };
}

export async function updateLeaveType(id: string, input: CreateLeaveTypeInput): Promise<ActionResult> {
  const actor = await requirePermission("leave.policy.manage");
  const parsed = createLeaveTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.leaveType.findFirst({ where: { id, companyId: actor.companyId } });
  if (!existing) {
    return { success: false, error: "Leave type not found." };
  }

  const codeTaken = await db.leaveType.findFirst({
    where: { companyId: actor.companyId, code: parsed.data.code, id: { not: id } },
  });
  if (codeTaken) {
    return { success: false, error: "Another leave type already uses that code." };
  }

  const { allowCarryForward, maxCarryForwardDays, requiresDocumentAfterDays, maxConsecutiveDays, ...rest } =
    parsed.data;

  await db.$transaction(async (tx) => {
    await tx.leaveType.update({
      where: { id },
      data: {
        ...rest,
        allowCarryForward,
        maxCarryForwardDays: allowCarryForward && maxCarryForwardDays > 0 ? maxCarryForwardDays : null,
        requiresDocumentAfterDays: requiresDocumentAfterDays > 0 ? requiresDocumentAfterDays : null,
        maxConsecutiveDays: maxConsecutiveDays > 0 ? maxConsecutiveDays : null,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "leave_type.updated",
      entityType: "LeaveType",
      entityId: id,
      beforeState: { name: existing.name, annualQuotaDays: existing.annualQuotaDays.toString() },
      afterState: { name: rest.name, annualQuotaDays: rest.annualQuotaDays },
    });
  });

  revalidatePath("/admin/leave-policy");
  return { success: true };
}

export async function setLeaveTypeActive(id: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requirePermission("leave.policy.manage");

  const existing = await db.leaveType.findFirst({ where: { id, companyId: actor.companyId } });
  if (!existing) {
    return { success: false, error: "Leave type not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.leaveType.update({ where: { id }, data: { isActive } });
    await recordAudit(tx, {
      actor,
      action: isActive ? "leave_type.activated" : "leave_type.deactivated",
      entityType: "LeaveType",
      entityId: id,
    });
  });

  revalidatePath("/admin/leave-policy");
  return { success: true };
}

export async function applyLeave(input: ApplyLeaveInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = applyLeaveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);

  const holidays = await db.holiday.findMany({
    where: { companyId: actor.companyId, date: { gte: startDate, lte: endDate } },
    select: { date: true },
  });
  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const totalDays = countWorkingDays(startDate, endDate, holidayDates);

  if (totalDays === 0) {
    return { success: false, error: "That range doesn't include any working days." };
  }

  const overlapping = await db.leaveRequest.findFirst({
    where: {
      userId: actor.id,
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (overlapping) {
    return { success: false, error: "This overlaps a request you've already submitted." };
  }

  const year = startDate.getUTCFullYear();
  const leaveType = await db.leaveType.findFirst({
    where: { id: parsed.data.leaveTypeId, companyId: actor.companyId },
  });
  if (!leaveType) {
    return { success: false, error: "That leave type doesn't exist." };
  }

  const balance = await db.leaveBalance.upsert({
    where: { userId_leaveTypeId_year: { userId: actor.id, leaveTypeId: leaveType.id, year } },
    update: {},
    create: {
      companyId: actor.companyId,
      userId: actor.id,
      leaveTypeId: leaveType.id,
      year,
      allocatedDays: leaveType.annualQuotaDays,
    },
  });

  const available =
    Number(balance.allocatedDays) + Number(balance.carriedForwardDays) - Number(balance.usedDays) - Number(balance.pendingDays);
  if (leaveType.deductsFromBalance && available < totalDays) {
    return { success: false, error: `Not enough balance — only ${available} day(s) left.` };
  }

  const chain = await buildLeaveApprovalChain(
    { id: actor.id, companyId: actor.companyId, role: actor.role, managerId: actor.managerId },
    totalDays,
  );
  const autoApproved = chain.length === 0;

  await db.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        totalDays,
        reason: parsed.data.reason,
        status: autoApproved ? "APPROVED" : "PENDING",
        appliedAt: new Date(),
        finalDecisionAt: autoApproved ? new Date() : null,
        currentApprovalStage: 1,
      },
    });

    for (const [index, stage] of chain.entries()) {
      await tx.leaveApproval.create({
        data: {
          companyId: actor.companyId,
          leaveRequestId: request.id,
          approverId: stage.approverId,
          stage: index + 1,
          role: stage.role,
          decision: "PENDING",
        },
      });
    }

    if (autoApproved) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: { increment: totalDays } },
      });
    } else {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: totalDays } },
      });
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId: chain[0].approverId,
          category: "LEAVE_REQUEST",
          title: "Leave request awaiting your approval",
          body: `${actor.name} requested ${totalDays} day(s) of ${leaveType.name}.`,
          linkUrl: "/leave/approvals",
        },
      });
    }

    await recordAudit(tx, {
      actor,
      action: autoApproved ? "leave.auto_approved" : "leave.requested",
      entityType: "LeaveRequest",
      entityId: request.id,
      afterState: { totalDays, leaveType: leaveType.name, status: request.status },
    });
  });

  revalidatePath("/leave");
  revalidatePath("/leave/approvals");
  return { success: true };
}

export async function decideLeave(
  leaveRequestId: string,
  decision: "APPROVED" | "REJECTED",
  comment?: string,
): Promise<ActionResult> {
  const actor = await requirePermission("leave.approve");

  const request = await db.leaveRequest.findFirst({
    where: { id: leaveRequestId, companyId: actor.companyId, status: "PENDING" },
    include: { approvals: { orderBy: { stage: "asc" } }, leaveType: true },
  });
  if (!request) {
    return { success: false, error: "That request isn't awaiting a decision." };
  }

  const currentStage = request.approvals.find((a) => a.stage === request.currentApprovalStage);
  if (!currentStage || currentStage.approverId !== actor.id) {
    return { success: false, error: "You're not the approver for this stage." };
  }

  await db.$transaction(async (tx) => {
    await tx.leaveApproval.update({
      where: { id: currentStage.id },
      data: { decision, comment, decidedAt: new Date() },
    });

    if (decision === "REJECTED") {
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED", finalDecisionAt: new Date() },
      });
      await tx.leaveBalance.updateMany({
        where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year: request.startDate.getUTCFullYear() },
        data: { pendingDays: { decrement: Number(request.totalDays) } },
      });
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId: request.userId,
          category: "LEAVE_DECISION",
          title: "Leave request rejected",
          body: `Your ${request.leaveType.name} request was rejected.`,
        },
      });
    } else {
      const nextStage = request.approvals.find((a) => a.stage === request.currentApprovalStage + 1);
      if (nextStage) {
        await tx.leaveRequest.update({
          where: { id: request.id },
          data: { currentApprovalStage: nextStage.stage },
        });
        await tx.notification.create({
          data: {
            companyId: actor.companyId,
            userId: nextStage.approverId,
            category: "LEAVE_REQUEST",
            title: "Leave request awaiting your approval",
            body: `A leave request has moved to your stage.`,
            linkUrl: "/leave/approvals",
          },
        });
      } else {
        await tx.leaveRequest.update({
          where: { id: request.id },
          data: { status: "APPROVED", finalDecisionAt: new Date() },
        });
        await tx.leaveBalance.updateMany({
          where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year: request.startDate.getUTCFullYear() },
          data: {
            pendingDays: { decrement: Number(request.totalDays) },
            usedDays: { increment: Number(request.totalDays) },
          },
        });

        const cursor = new Date(request.startDate);
        while (cursor <= request.endDate) {
          const day = cursor.getUTCDay();
          if (day !== 0 && day !== 6) {
            await tx.attendanceRecord.upsert({
              where: { userId_workDate: { userId: request.userId, workDate: new Date(cursor) } },
              update: { status: "ON_LEAVE" },
              create: {
                companyId: actor.companyId,
                userId: request.userId,
                workDate: new Date(cursor),
                status: "ON_LEAVE",
              },
            });
          }
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        await tx.notification.create({
          data: {
            companyId: actor.companyId,
            userId: request.userId,
            category: "LEAVE_DECISION",
            title: "Leave request approved",
            body: `Your ${request.leaveType.name} request was approved.`,
          },
        });
      }
    }

    await recordAudit(tx, {
      actor,
      action: `leave.${decision.toLowerCase()}`,
      entityType: "LeaveRequest",
      entityId: request.id,
    });
  });

  revalidatePath("/leave/approvals");
  revalidatePath("/leave");
  return { success: true };
}
