import "server-only";
import { db } from "@/server/db";
import { scopeFilter, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { computeTargetProgress, computeSaleCommission } from "@/server/services/sales.service";

export async function listProducts(companyId: string) {
  return db.product.findMany({
    where: { companyId, isActive: true },
    include: { assignments: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { name: "asc" },
  });
}

/** Management view — includes deactivated products so admins can still edit/reactivate them. */
export async function listAllProducts(companyId: string) {
  return db.product.findMany({
    where: { companyId },
    include: { assignments: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function listMyTargets(actor: AppUser) {
  const targets = await db.salesTarget.findMany({
    where: {
      status: "ACTIVE",
      OR: actor.departmentId
        ? [{ userId: actor.id }, { departmentId: actor.departmentId }]
        : [{ userId: actor.id }],
    },
    include: { department: { select: { name: true } } },
    orderBy: { endDate: "asc" },
  });

  return Promise.all(
    targets.map(async (target) => ({ target, progress: await computeTargetProgress(target) })),
  );
}

export async function listTeamTargets(actor: AppUser) {
  if (!hasPermission(actor.role, "sales.target.manage") && !hasPermission(actor.role, "sales.read")) return [];

  const filter = await scopeFilter(actor, "sales.read");
  if (!filter) return [];

  const targets = await db.salesTarget.findMany({
    where: {
      status: "ACTIVE",
      ...(filter.companyId ? { companyId: filter.companyId } : { userId: filter.userId }),
    },
    include: { user: { select: { id: true, name: true, employeeCode: true } }, department: { select: { name: true } } },
    orderBy: { endDate: "asc" },
  });

  return Promise.all(
    targets.map(async (target) => ({ target, progress: await computeTargetProgress(target) })),
  );
}

export async function listOwnSales(actor: AppUser, take = 30) {
  return db.sale.findMany({
    where: { userId: actor.id },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listPendingSales(actor: AppUser) {
  const filter = await scopeFilter(actor, "sales.approve");
  if (!filter) return [];

  return db.sale.findMany({
    where: {
      status: "PENDING",
      ...(filter.companyId ? { companyId: filter.companyId } : { userId: filter.userId }),
    },
    include: { user: { select: { name: true, employeeCode: true } }, product: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** For the employee profile page (spec §3.51 "Employee sales profile/dashboard"). */
export async function getEmployeeSalesSummary(userId: string) {
  const targets = await db.salesTarget.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { endDate: "asc" },
  });

  const targetsWithProgress = await Promise.all(
    targets.map(async (target) => ({ target, progress: await computeTargetProgress(target) })),
  );

  const approvedCount = await db.sale.count({ where: { userId, status: "APPROVED" } });

  return { targets: targetsWithProgress, approvedSalesCount: approvedCount };
}

/** Approved revenue this month, per rep — the "fun" leaderboard (spec item §14.276). */
export async function getLeaderboard(companyId: string, take = 10) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const sales = await db.sale.findMany({
    where: { companyId, status: "APPROVED", saleDate: { gte: monthStart } },
    select: { amount: true, userId: true, user: { select: { name: true, employeeCode: true } } },
  });

  const totals = new Map<string, { name: string; employeeCode: string; total: number }>();
  for (const sale of sales) {
    const existing = totals.get(sale.userId);
    const amount = Number(sale.amount);
    if (existing) {
      existing.total += amount;
    } else {
      totals.set(sale.userId, { name: sale.user.name, employeeCode: sale.user.employeeCode, total: amount });
    }
  }

  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, take);
}

/** Own commission statement (§6.119) — approved sales this month + all-time. */
export async function getOwnCommissionStatement(actor: AppUser) {
  const sales = await db.sale.findMany({
    where: { userId: actor.id, status: "APPROVED", productId: { not: null } },
    include: { product: { select: { name: true, commissionPercent: true } } },
    orderBy: { saleDate: "desc" },
  });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const lines = sales.map((sale) => ({
    sale,
    commission: computeSaleCommission(sale, sale.product),
  }));

  const allTimeTotal = lines.reduce((sum, l) => sum + l.commission, 0);
  const thisMonthTotal = lines
    .filter((l) => l.sale.saleDate >= monthStart)
    .reduce((sum, l) => sum + l.commission, 0);

  return { lines, allTimeTotal, thisMonthTotal };
}

/** Per-rep commission rollup for managers/HR/admin (§6.119 "statement generation"). */
export async function getTeamCommissionSummary(actor: AppUser) {
  const filter = await scopeFilter(actor, "sales.approve");
  if (!filter) return [];

  const sales = await db.sale.findMany({
    where: {
      status: "APPROVED",
      productId: { not: null },
      ...(filter.companyId ? { companyId: filter.companyId } : { userId: filter.userId }),
    },
    include: {
      product: { select: { commissionPercent: true } },
      user: { select: { id: true, name: true, employeeCode: true } },
    },
  });

  const totals = new Map<string, { name: string; employeeCode: string; total: number; saleCount: number }>();
  for (const sale of sales) {
    const commission = computeSaleCommission(sale, sale.product);
    const existing = totals.get(sale.userId);
    if (existing) {
      existing.total += commission;
      existing.saleCount += 1;
    } else {
      totals.set(sale.userId, {
        name: sale.user.name,
        employeeCode: sale.user.employeeCode,
        total: commission,
        saleCount: 1,
      });
    }
  }

  return [...totals.values()].sort((a, b) => b.total - a.total);
}
