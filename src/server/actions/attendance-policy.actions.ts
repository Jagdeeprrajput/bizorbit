"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import {
  createAttendancePolicySchema,
  type CreateAttendancePolicyInput,
} from "@/lib/validations/attendance-policy";

type ActionResult = { success: true } | { success: false; error: string };

export async function createAttendancePolicy(input: CreateAttendancePolicyInput): Promise<ActionResult> {
  const actor = await requirePermission("settings.manage");
  const parsed = createAttendancePolicySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // A department-specific policy is an override, not "the" default — only
  // one company-wide default may exist at a time.
  const isDefault = data.appliesToDepartmentId ? false : data.isDefault;

  await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.attendancePolicy.updateMany({
        where: { companyId: actor.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await tx.attendancePolicy.create({
      data: {
        companyId: actor.companyId,
        name: data.name,
        isDefault,
        shiftStartTime: data.shiftStartTime,
        shiftEndTime: data.shiftEndTime,
        graceMinutes: data.graceMinutes,
        minFullDayMinutes: data.minFullDayMinutes,
        minHalfDayMinutes: data.minHalfDayMinutes,
        maxBreakMinutesPerDay: data.maxBreakMinutesPerDay,
        workingDays: data.workingDays,
        requireGeofence: data.requireGeofence,
        allowRemoteClockIn: data.allowRemoteClockIn,
        appliesToDepartmentId: data.appliesToDepartmentId || null,
      },
    });

    await recordAudit(tx, {
      actor,
      action: "attendance_policy.created",
      entityType: "AttendancePolicy",
      entityId: created.id,
      afterState: { name: created.name, isDefault },
    });
  });

  revalidatePath("/admin/attendance-policy");
  return { success: true };
}

export async function deleteAttendancePolicy(id: string): Promise<ActionResult> {
  const actor = await requirePermission("settings.manage");
  const existing = await db.attendancePolicy.findFirst({ where: { id, companyId: actor.companyId } });
  if (!existing) {
    return { success: false, error: "Policy not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.attendancePolicy.delete({ where: { id } });
    await recordAudit(tx, {
      actor,
      action: "attendance_policy.deleted",
      entityType: "AttendancePolicy",
      entityId: id,
      beforeState: { name: existing.name },
    });
  });

  revalidatePath("/admin/attendance-policy");
  return { success: true };
}
