"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import {
  inviteEmployeeSchema,
  updateEmployeeDetailsSchema,
  type InviteEmployeeInput,
  type UpdateEmployeeDetailsInput,
} from "@/lib/validations/employee";

type ActionResult = { success: true } | { success: false; error: string };

export async function inviteEmployee(input: InviteEmployeeInput): Promise<ActionResult> {
  const actor = await requirePermission("employee.create");

  const parsed = inviteEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // §5.4 — HR cannot grant roles above EMPLOYEE. Only Super Admin can.
  const role = actor.role === "SUPER_ADMIN" ? data.role : "EMPLOYEE";

  const existing = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    return { success: false, error: "An account with that email already exists." };
  }

  const employeeCount = await db.user.count({ where: { companyId: actor.companyId } });
  const employeeCode = `BZO-${String(employeeCount + 1).padStart(4, "0")}`;

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        companyId: actor.companyId,
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        status: "INVITED",
        emailVerified: true,
        employeeCode,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        managerId: data.managerId || null,
        primaryOfficeId: data.primaryOfficeId || null,
        employmentType: data.employmentType,
        workMode: data.workMode,
      },
    });

    await recordAudit(tx, {
      actor,
      action: "employee.invited",
      entityType: "User",
      entityId: created.id,
      afterState: { email: created.email, role: created.role, employeeCode },
    });

    return created;
  });

  await auth.api.requestPasswordReset({
    body: { email: user.email, redirectTo: "/reset-password" },
  });

  revalidatePath("/employees");
  return { success: true };
}

export async function updateEmployeeDetails(userId: string, input: UpdateEmployeeDetailsInput): Promise<ActionResult> {
  const actor = await requirePermission("employee.update");

  const parsed = updateEmployeeDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.managerId === userId) {
    return { success: false, error: "An employee can't be their own manager." };
  }

  const target = await db.user.findFirst({ where: { id: userId, companyId: actor.companyId, deletedAt: null } });
  if (!target) {
    return { success: false, error: "Employee not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        managerId: data.managerId || null,
        primaryOfficeId: data.primaryOfficeId || null,
        employmentType: data.employmentType,
        workMode: data.workMode,
        phone: data.phone || null,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "employee.updated",
      entityType: "User",
      entityId: userId,
      beforeState: {
        departmentId: target.departmentId,
        designationId: target.designationId,
        managerId: target.managerId,
      },
      afterState: {
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        managerId: data.managerId ?? null,
      },
    });
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${userId}`);
  return { success: true };
}

/**
 * Sets status to OFFBOARDED and deletes every session row for this user —
 * with database-backed sessions this is instant: their very next request
 * fails, not "whenever their token happens to expire" (§8.4).
 */
export async function offboardEmployee(userId: string): Promise<ActionResult> {
  const actor = await requirePermission("employee.offboard");

  const target = await db.user.findFirst({ where: { id: userId, companyId: actor.companyId } });
  if (!target) {
    return { success: false, error: "Employee not found." };
  }
  if (target.status === "OFFBOARDED") {
    return { success: false, error: "Already offboarded." };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status: "OFFBOARDED", dateOfLeaving: new Date() },
    });
    await tx.session.deleteMany({ where: { userId } });
    await recordAudit(tx, {
      actor,
      action: "employee.offboarded",
      entityType: "User",
      entityId: userId,
      beforeState: { status: target.status },
      afterState: { status: "OFFBOARDED" },
      severity: "WARNING",
    });
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${userId}`);
  return { success: true };
}
