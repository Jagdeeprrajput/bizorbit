"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import {
  createDepartmentSchema,
  createOfficeSchema,
  createHolidaySchema,
  createDesignationSchema,
  type CreateDepartmentInput,
  type CreateOfficeInput,
  type CreateHolidayInput,
  type CreateDesignationInput,
} from "@/lib/validations/organisation";

type ActionResult = { success: true } | { success: false; error: string };

export async function createDepartment(input: CreateDepartmentInput): Promise<ActionResult> {
  const actor = await requirePermission("department.manage");
  const parsed = createDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.department.findFirst({
    where: { companyId: actor.companyId, code: parsed.data.code },
  });
  if (existing) {
    return { success: false, error: "A department with that code already exists." };
  }

  const department = await db.$transaction(async (tx) => {
    const created = await tx.department.create({
      data: { companyId: actor.companyId, ...parsed.data },
    });
    await recordAudit(tx, {
      actor,
      action: "department.created",
      entityType: "Department",
      entityId: created.id,
      afterState: { name: created.name, code: created.code },
    });
    return created;
  });

  revalidatePath("/admin/departments");
  return department ? { success: true } : { success: false, error: "Something went wrong." };
}

export async function updateDepartment(id: string, input: CreateDepartmentInput): Promise<ActionResult> {
  const actor = await requirePermission("department.manage");
  const parsed = createDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.department.findFirst({ where: { id, companyId: actor.companyId } });
  if (!existing) {
    return { success: false, error: "Department not found." };
  }

  const codeTaken = await db.department.findFirst({
    where: { companyId: actor.companyId, code: parsed.data.code, id: { not: id } },
  });
  if (codeTaken) {
    return { success: false, error: "Another department already uses that code." };
  }

  await db.$transaction(async (tx) => {
    await tx.department.update({ where: { id }, data: parsed.data });
    await recordAudit(tx, {
      actor,
      action: "department.updated",
      entityType: "Department",
      entityId: id,
      beforeState: { name: existing.name, code: existing.code },
      afterState: { name: parsed.data.name, code: parsed.data.code },
    });
  });

  revalidatePath("/admin/departments");
  return { success: true };
}

export async function createOffice(input: CreateOfficeInput): Promise<ActionResult> {
  const actor = await requirePermission("office.manage");
  const parsed = createOfficeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.$transaction(async (tx) => {
    const created = await tx.officeLocation.create({
      data: { companyId: actor.companyId, ...parsed.data },
    });
    await recordAudit(tx, {
      actor,
      action: "office.created",
      entityType: "OfficeLocation",
      entityId: created.id,
      afterState: { name: created.name },
    });
  });

  revalidatePath("/admin/offices");
  return { success: true };
}

export async function updateOffice(id: string, input: CreateOfficeInput): Promise<ActionResult> {
  const actor = await requirePermission("office.manage");
  const parsed = createOfficeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.officeLocation.findFirst({ where: { id, companyId: actor.companyId } });
  if (!existing) {
    return { success: false, error: "Office not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.officeLocation.update({ where: { id }, data: parsed.data });
    await recordAudit(tx, {
      actor,
      action: "office.updated",
      entityType: "OfficeLocation",
      entityId: id,
      beforeState: { name: existing.name },
      afterState: { name: parsed.data.name },
    });
  });

  revalidatePath("/admin/offices");
  return { success: true };
}

export async function createHoliday(input: CreateHolidayInput): Promise<ActionResult> {
  const actor = await requirePermission("department.manage");
  const parsed = createHolidaySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.$transaction(async (tx) => {
    const created = await tx.holiday.create({
      data: {
        companyId: actor.companyId,
        name: parsed.data.name,
        date: new Date(parsed.data.date),
        type: parsed.data.type,
        description: parsed.data.description,
        isRecurring: parsed.data.isRecurring,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "holiday.created",
      entityType: "Holiday",
      entityId: created.id,
      afterState: { name: created.name, date: parsed.data.date },
    });
  });

  revalidatePath("/admin/holidays");
  return { success: true };
}

export async function createDesignation(input: CreateDesignationInput): Promise<ActionResult> {
  const actor = await requirePermission("department.manage");
  const parsed = createDesignationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.designation.findFirst({
    where: { companyId: actor.companyId, code: parsed.data.code },
  });
  if (existing) {
    return { success: false, error: "A designation with that code already exists." };
  }

  await db.$transaction(async (tx) => {
    const created = await tx.designation.create({
      data: {
        companyId: actor.companyId,
        title: parsed.data.title,
        code: parsed.data.code,
        level: parsed.data.level,
        departmentId: parsed.data.departmentId || null,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "designation.created",
      entityType: "Designation",
      entityId: created.id,
      afterState: { title: created.title, code: created.code },
    });
  });

  revalidatePath("/admin/designations");
  return { success: true };
}
