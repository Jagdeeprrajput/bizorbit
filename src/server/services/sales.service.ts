import "server-only";
import { db } from "@/server/db";

export type TargetHealth = "good" | "warning" | "critical";

/**
 * Pace-adjusted health, not just raw %: a target at 40% achieved with only
 * 30% of the period elapsed is fine; the same 40% with 90% of the period
 * gone is critical. This is item §5.96's "Red/Yellow/Green" indicator.
 */
export function computeTargetHealth(percentAchieved: number, percentElapsed: number): TargetHealth {
  if (percentAchieved >= 100) return "good";
  const gap = percentElapsed - percentAchieved;
  if (gap <= 10) return "good";
  if (gap <= 25) return "warning";
  return "critical";
}

export function percentElapsed(startDate: Date, endDate: Date, now: Date = new Date()): number {
  const total = endDate.getTime() - startDate.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - startDate.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export async function getAchievedValue(targetId: string, metric: "REVENUE" | "UNITS" | "DEALS") {
  const sales = await db.sale.findMany({
    where: { targetId, status: "APPROVED" },
    select: { amount: true, quantity: true },
  });

  if (metric === "REVENUE") {
    return sales.reduce((sum, s) => sum + Number(s.amount), 0);
  }
  if (metric === "UNITS") {
    return sales.reduce((sum, s) => sum + s.quantity, 0);
  }
  return sales.length; // DEALS — one sale row = one deal
}

/** Commission earned on one sale — amount × the linked product's commission % (§6.111, §6.116). */
export function computeSaleCommission(sale: { amount: unknown }, product: { commissionPercent: unknown } | null): number {
  if (!product) return 0;
  return Number(sale.amount) * (Number(product.commissionPercent) / 100);
}

export type TargetProgress = {
  achieved: number;
  targetValue: number;
  percentAchieved: number;
  percentElapsed: number;
  health: TargetHealth;
  daysRemaining: number;
};

export async function computeTargetProgress(target: {
  id: string;
  metric: "REVENUE" | "UNITS" | "DEALS";
  targetValue: unknown;
  startDate: Date;
  endDate: Date;
}): Promise<TargetProgress> {
  const targetValue = Number(target.targetValue);
  const achieved = await getAchievedValue(target.id, target.metric);
  const percentAchieved = targetValue > 0 ? Math.min(999, (achieved / targetValue) * 100) : 0;
  const elapsed = percentElapsed(target.startDate, target.endDate);
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((target.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    achieved,
    targetValue,
    percentAchieved,
    percentElapsed: elapsed,
    health: computeTargetHealth(percentAchieved, elapsed),
    daysRemaining,
  };
}
