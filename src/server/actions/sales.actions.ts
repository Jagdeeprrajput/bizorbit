"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission, requireAuth, type AppUser } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import {
  createProductSchema,
  updateProductSchema,
  createSalesTargetSchema,
  updateSalesTargetSchema,
  recordSaleSchema,
  updateSaleSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateSalesTargetInput,
  type UpdateSalesTargetInput,
  type RecordSaleInput,
  type UpdateSaleInput,
} from "@/lib/validations/sales";

type ActionResult = { success: true } | { success: false; error: string };

export async function createProduct(input: CreateProductInput): Promise<ActionResult> {
  const actor = await requirePermission("product.manage");
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.product.findFirst({ where: { companyId: actor.companyId, sku: parsed.data.sku } });
  if (existing) {
    return { success: false, error: "A product with that SKU already exists." };
  }

  await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        companyId: actor.companyId,
        name: parsed.data.name,
        sku: parsed.data.sku,
        category: parsed.data.category,
        price: parsed.data.price,
        commissionPercent: parsed.data.commissionPercent,
        description: parsed.data.description,
      },
    });

    for (const userId of parsed.data.assigneeIds) {
      await tx.productAssignment.create({
        data: { companyId: actor.companyId, productId: product.id, userId },
      });
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId,
          category: "ANNOUNCEMENT",
          title: "New product assigned to you",
          body: product.name,
          linkUrl: "/sales/products",
        },
      });
    }

    await recordAudit(tx, {
      actor,
      action: "product.created",
      entityType: "Product",
      entityId: product.id,
      afterState: { name: product.name, sku: product.sku },
    });
  });

  revalidatePath("/sales/products");
  return { success: true };
}

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<ActionResult> {
  const actor = await requirePermission("product.manage");
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const product = await db.product.findFirst({ where: { id: productId, companyId: actor.companyId } });
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const skuTaken = await db.product.findFirst({
    where: { companyId: actor.companyId, sku: parsed.data.sku, id: { not: productId } },
  });
  if (skuTaken) {
    return { success: false, error: "A product with that SKU already exists." };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        category: parsed.data.category,
        price: parsed.data.price,
        commissionPercent: parsed.data.commissionPercent,
        description: parsed.data.description,
      },
    });

    const currentAssignments = await tx.productAssignment.findMany({ where: { productId } });
    const currentUserIds = currentAssignments.map((a) => a.userId);
    const added = parsed.data.assigneeIds.filter((id) => !currentUserIds.includes(id));
    const removed = currentUserIds.filter((id) => !parsed.data.assigneeIds.includes(id));

    if (removed.length > 0) {
      await tx.productAssignment.deleteMany({ where: { productId, userId: { in: removed } } });
    }
    for (const userId of added) {
      await tx.productAssignment.create({ data: { companyId: actor.companyId, productId, userId } });
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId,
          category: "ANNOUNCEMENT",
          title: "New product assigned to you",
          body: parsed.data.name,
          linkUrl: "/sales/products",
        },
      });
    }

    await recordAudit(tx, {
      actor,
      action: "product.updated",
      entityType: "Product",
      entityId: productId,
      beforeState: { name: product.name, sku: product.sku },
      afterState: { name: parsed.data.name, sku: parsed.data.sku },
    });
  });

  revalidatePath("/sales/products");
  return { success: true };
}

export async function toggleProductActive(productId: string): Promise<ActionResult> {
  const actor = await requirePermission("product.manage");
  const product = await db.product.findFirst({ where: { id: productId, companyId: actor.companyId } });
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: { isActive: !product.isActive } });
    await recordAudit(tx, {
      actor,
      action: product.isActive ? "product.deactivated" : "product.activated",
      entityType: "Product",
      entityId: productId,
    });
  });

  revalidatePath("/sales/products");
  return { success: true };
}

export async function createSalesTarget(input: CreateSalesTargetInput): Promise<ActionResult> {
  const actor = await requirePermission("sales.target.manage");
  const parsed = createSalesTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    const target = await tx.salesTarget.create({
      data: {
        companyId: actor.companyId,
        userId: data.assignTo === "USER" ? data.userId : null,
        departmentId: data.assignTo === "DEPARTMENT" ? data.departmentId : null,
        metric: data.metric,
        targetValue: data.targetValue,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notes: data.notes,
        createdById: actor.id,
      },
    });

    if (data.userId) {
      await tx.notification.create({
        data: {
          companyId: actor.companyId,
          userId: data.userId,
          category: "ANNOUNCEMENT",
          title: "New sales target assigned",
          body: `${data.metric} target of ${data.targetValue} for ${data.period.toLowerCase()}.`,
          linkUrl: "/sales",
        },
      });
    }

    await recordAudit(tx, {
      actor,
      action: "sales_target.created",
      entityType: "SalesTarget",
      entityId: target.id,
      afterState: { metric: target.metric, targetValue: data.targetValue },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  return { success: true };
}

export async function updateSalesTarget(targetId: string, input: UpdateSalesTargetInput): Promise<ActionResult> {
  const actor = await requirePermission("sales.target.manage");
  const parsed = updateSalesTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const target = await db.salesTarget.findFirst({ where: { id: targetId, companyId: actor.companyId } });
  if (!target) {
    return { success: false, error: "Target not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.salesTarget.update({
      where: { id: targetId },
      data: {
        targetValue: parsed.data.targetValue,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        notes: parsed.data.notes,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "sales_target.updated",
      entityType: "SalesTarget",
      entityId: targetId,
      beforeState: { targetValue: Number(target.targetValue) },
      afterState: { targetValue: parsed.data.targetValue },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  return { success: true };
}

export async function cancelSalesTarget(targetId: string): Promise<ActionResult> {
  const actor = await requirePermission("sales.target.manage");
  const target = await db.salesTarget.findFirst({ where: { id: targetId, companyId: actor.companyId } });
  if (!target) {
    return { success: false, error: "Target not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.salesTarget.update({ where: { id: targetId }, data: { status: "CANCELLED" } });
    await recordAudit(tx, {
      actor,
      action: "sales_target.cancelled",
      entityType: "SalesTarget",
      entityId: targetId,
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  return { success: true };
}

export async function recordSale(input: RecordSaleInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = recordSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        targetId: data.targetId || null,
        productId: data.productId || null,
        clientName: data.clientName,
        amount: data.amount,
        quantity: data.quantity,
        saleDate: new Date(data.saleDate),
        source: data.source,
        notes: data.notes,
        status: "PENDING",
      },
    });

    await recordAudit(tx, {
      actor,
      action: "sale.recorded",
      entityType: "Sale",
      entityId: sale.id,
      afterState: { clientName: sale.clientName, amount: data.amount },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/entries");
  return { success: true };
}

export async function updateSale(saleId: string, input: UpdateSaleInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = updateSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const sale = await db.sale.findFirst({ where: { id: saleId, companyId: actor.companyId, userId: actor.id } });
  if (!sale) {
    return { success: false, error: "Sale not found." };
  }
  if (sale.status !== "PENDING") {
    return { success: false, error: "Only pending sales can be edited." };
  }

  const data = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: saleId },
      data: {
        targetId: data.targetId || null,
        productId: data.productId || null,
        clientName: data.clientName,
        amount: data.amount,
        quantity: data.quantity,
        saleDate: new Date(data.saleDate),
        source: data.source,
        notes: data.notes,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "sale.updated",
      entityType: "Sale",
      entityId: saleId,
      beforeState: { clientName: sale.clientName, amount: Number(sale.amount) },
      afterState: { clientName: data.clientName, amount: data.amount },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/entries");
  return { success: true };
}

export async function deleteSale(saleId: string): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const sale = await db.sale.findFirst({ where: { id: saleId, companyId: actor.companyId, userId: actor.id } });
  if (!sale) {
    return { success: false, error: "Sale not found." };
  }
  if (sale.status !== "PENDING") {
    return { success: false, error: "Only pending sales can be deleted." };
  }

  await db.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id: saleId } });
    await recordAudit(tx, {
      actor,
      action: "sale.deleted",
      entityType: "Sale",
      entityId: saleId,
      beforeState: { clientName: sale.clientName, amount: Number(sale.amount) },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/entries");
  return { success: true };
}

export async function decideSale(saleId: string, approve: boolean): Promise<ActionResult> {
  const actor = await requirePermission("sales.approve");

  const sale = await db.sale.findFirst({ where: { id: saleId, companyId: actor.companyId, status: "PENDING" } });
  if (!sale) {
    return { success: false, error: "Nothing to decide here." };
  }

  await db.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: sale.id },
      data: { status: approve ? "APPROVED" : "REJECTED", approvedById: actor.id, approvedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        companyId: actor.companyId,
        userId: sale.userId,
        category: "ANNOUNCEMENT",
        title: approve ? "Sale approved" : "Sale rejected",
        body: `${sale.clientName} — ${Number(sale.amount)}`,
        linkUrl: "/sales/entries",
      },
    });
    await recordAudit(tx, {
      actor,
      action: approve ? "sale.approved" : "sale.rejected",
      entityType: "Sale",
      entityId: sale.id,
    });
  });

  revalidatePath("/sales");
  revalidatePath("/sales/entries");
  return { success: true };
}
