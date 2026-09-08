import "server-only";
import { db } from "@/server/db";

export type ShiftPolicy = {
  shiftStartTime: string; // "HH:mm"
  shiftEndTime: string; // "HH:mm"
  graceMinutes: number;
  minFullDayMinutes: number;
  minHalfDayMinutes: number;
};

export const DEFAULT_SHIFT_POLICY: ShiftPolicy = {
  shiftStartTime: "09:00",
  shiftEndTime: "18:00",
  graceMinutes: 15,
  minFullDayMinutes: 480,
  minHalfDayMinutes: 240,
};

/**
 * Department-specific policy wins if one exists; otherwise the company
 * default; otherwise the hardcoded fallback — so attendance works before
 * any policy is configured, per AGENTS.md's "secure/sane by default" rule.
 */
export async function getEffectivePolicy(companyId: string, departmentId?: string | null): Promise<ShiftPolicy> {
  if (departmentId) {
    const departmentPolicy = await db.attendancePolicy.findFirst({
      where: { companyId, appliesToDepartmentId: departmentId },
    });
    if (departmentPolicy) return departmentPolicy;
  }

  const defaultPolicy = await db.attendancePolicy.findFirst({
    where: { companyId, isDefault: true },
  });
  return defaultPolicy ?? DEFAULT_SHIFT_POLICY;
}

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function computeLateness(clockInAt: Date, policy: ShiftPolicy) {
  const shiftStartMinutes = parseTimeToMinutes(policy.shiftStartTime);
  const clockInMinutes = minutesSinceMidnight(clockInAt);
  const lateByMinutes = clockInMinutes - shiftStartMinutes - policy.graceMinutes;
  return lateByMinutes > 0 ? { isLate: true, lateByMinutes } : { isLate: false, lateByMinutes: 0 };
}

export function computeEarlyDeparture(clockOutAt: Date, policy: ShiftPolicy) {
  const shiftEndMinutes = parseTimeToMinutes(policy.shiftEndTime);
  const clockOutMinutes = minutesSinceMidnight(clockOutAt);
  const earlyByMinutes = shiftEndMinutes - clockOutMinutes;
  return earlyByMinutes > 0
    ? { isEarlyDeparture: true, earlyByMinutes }
    : { isEarlyDeparture: false, earlyByMinutes: 0 };
}

export function computeDayStatus(netWorkMinutes: number, policy: ShiftPolicy) {
  if (netWorkMinutes >= policy.minFullDayMinutes) return "PRESENT" as const;
  if (netWorkMinutes >= policy.minHalfDayMinutes) return "HALF_DAY" as const;
  return "PENDING_REGULARISATION" as const;
}

export function computeOvertime(netWorkMinutes: number, policy: ShiftPolicy) {
  const shiftMinutes = parseTimeToMinutes(policy.shiftEndTime) - parseTimeToMinutes(policy.shiftStartTime);
  const overtimeMinutes = netWorkMinutes - shiftMinutes;
  return overtimeMinutes > 0 ? { isOvertime: true, overtimeMinutes } : { isOvertime: false, overtimeMinutes: 0 };
}

/**
 * The office's calendar day, not the browser's — otherwise an employee
 * travelling abroad gets attributed to the wrong day (§9.7). Truncated to
 * UTC midnight for now; full IANA-timezone shifting is a Phase 9 refinement
 * once a date library (e.g. date-fns-tz) is in the dependency tree.
 */
export function workDateFor(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
