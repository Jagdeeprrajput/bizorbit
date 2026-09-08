"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireAuth, requirePermission, scopeFilter, type AppUser } from "@/lib/auth/guards";
import { checkGeofence } from "@/server/services/geofence.service";
import { recordAudit } from "@/server/services/audit.service";
import {
  requestRegularisationSchema,
  type RequestRegularisationInput,
} from "@/lib/validations/regularisation";
import {
  getEffectivePolicy,
  computeDayStatus,
  computeEarlyDeparture,
  computeLateness,
  computeOvertime,
  workDateFor,
} from "@/server/services/working-hours.service";
import { clockInSchema, clockOutSchema, type ClockInInput, type ClockOutInput } from "@/lib/validations/attendance";

type ActionResult = { success: true } | { success: false; error: string };

async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export async function clockIn(input: ClockInInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid location data" };
  }

  const now = new Date();
  const workDate = workDateFor(now);

  const existing = await db.attendanceRecord.findUnique({
    where: { userId_workDate: { userId: actor.id, workDate } },
  });
  if (existing?.clockInAt) {
    return { success: false, error: "You've already clocked in today." };
  }

  const offices = await db.officeLocation.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: { id: true, latitude: true, longitude: true, geofenceRadiusMeters: true },
  });

  const geofence = checkGeofence(
    { latitude: parsed.data.latitude, longitude: parsed.data.longitude, accuracyMeters: parsed.data.accuracyMeters },
    offices.map((o) => ({ ...o, latitude: Number(o.latitude), longitude: Number(o.longitude) })),
  );

  const policy = await getEffectivePolicy(actor.companyId, actor.departmentId);
  const { isLate, lateByMinutes } = computeLateness(now, policy);
  const ipAddress = await getClientIp();

  await db.attendanceRecord.upsert({
    where: { userId_workDate: { userId: actor.id, workDate } },
    create: {
      companyId: actor.companyId,
      userId: actor.id,
      workDate,
      status: "PRESENT",
      clockInAt: now,
      isLate,
      lateByMinutes: isLate ? lateByMinutes : null,
      clockInLatitude: parsed.data.latitude,
      clockInLongitude: parsed.data.longitude,
      clockInAccuracyMeters: parsed.data.accuracyMeters,
      clockInOfficeId: geofence.office?.id,
      clockInDistanceMeters: geofence.distanceMeters,
      clockInWithinGeofence: geofence.withinGeofence,
      clockInIpAddress: ipAddress,
      source: "WEB",
      isFlagged: !geofence.withinGeofence,
      flagReason: geofence.withinGeofence ? null : "Outside office geofence at clock-in",
    },
    update: {
      clockInAt: now,
      isLate,
      lateByMinutes: isLate ? lateByMinutes : null,
      clockInLatitude: parsed.data.latitude,
      clockInLongitude: parsed.data.longitude,
      clockInAccuracyMeters: parsed.data.accuracyMeters,
      clockInOfficeId: geofence.office?.id,
      clockInDistanceMeters: geofence.distanceMeters,
      clockInWithinGeofence: geofence.withinGeofence,
      clockInIpAddress: ipAddress,
      isFlagged: !geofence.withinGeofence,
      flagReason: geofence.withinGeofence ? null : "Outside office geofence at clock-in",
    },
  });

  revalidatePath("/attendance");
  return { success: true };
}

export async function clockOut(input: ClockOutInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid location data" };
  }

  const now = new Date();
  const workDate = workDateFor(now);

  const record = await db.attendanceRecord.findUnique({
    where: { userId_workDate: { userId: actor.id, workDate } },
    include: { breakSessions: true },
  });

  if (!record?.clockInAt) {
    return { success: false, error: "You haven't clocked in today." };
  }
  if (record.clockOutAt) {
    return { success: false, error: "You've already clocked out today." };
  }

  // Auto-close any break still open at clock-out and flag the record (§9.5).
  const openBreak = record.breakSessions.find((b) => !b.endedAt);
  let autoClosedBreak = false;
  if (openBreak) {
    const durationMinutes = Math.round((now.getTime() - openBreak.startedAt.getTime()) / 60000);
    await db.breakSession.update({
      where: { id: openBreak.id },
      data: { endedAt: now, durationMinutes },
    });
    autoClosedBreak = true;
  }

  const breakSessions = await db.breakSession.findMany({ where: { attendanceRecordId: record.id } });
  const totalBreakMinutes = breakSessions.reduce((sum, b) => sum + (b.durationMinutes ?? 0), 0);
  const totalWorkMinutes = Math.round((now.getTime() - record.clockInAt.getTime()) / 60000);
  const netWorkMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);

  const policy = await getEffectivePolicy(actor.companyId, actor.departmentId);
  const { isEarlyDeparture, earlyByMinutes } = computeEarlyDeparture(now, policy);
  const { isOvertime, overtimeMinutes } = computeOvertime(netWorkMinutes, policy);
  const status = computeDayStatus(netWorkMinutes, policy);

  const offices = await db.officeLocation.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: { id: true, latitude: true, longitude: true, geofenceRadiusMeters: true },
  });
  const geofence = checkGeofence(
    { latitude: parsed.data.latitude, longitude: parsed.data.longitude, accuracyMeters: parsed.data.accuracyMeters },
    offices.map((o) => ({ ...o, latitude: Number(o.latitude), longitude: Number(o.longitude) })),
  );
  const ipAddress = await getClientIp();

  await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutAt: now,
      totalWorkMinutes,
      totalBreakMinutes,
      netWorkMinutes,
      isEarlyDeparture,
      earlyByMinutes: isEarlyDeparture ? earlyByMinutes : null,
      isOvertime,
      overtimeMinutes: isOvertime ? overtimeMinutes : null,
      status,
      clockOutLatitude: parsed.data.latitude,
      clockOutLongitude: parsed.data.longitude,
      clockOutAccuracyMeters: parsed.data.accuracyMeters,
      clockOutOfficeId: geofence.office?.id,
      clockOutDistanceMeters: geofence.distanceMeters,
      clockOutWithinGeofence: geofence.withinGeofence,
      clockOutIpAddress: ipAddress,
      isFlagged: record.isFlagged || !geofence.withinGeofence || autoClosedBreak,
      flagReason: autoClosedBreak
        ? "Break auto-closed at clock-out"
        : !geofence.withinGeofence
          ? "Outside office geofence at clock-out"
          : record.flagReason,
    },
  });

  revalidatePath("/attendance");
  return { success: true };
}

export async function startBreak(): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const workDate = workDateFor(new Date());

  const record = await db.attendanceRecord.findUnique({
    where: { userId_workDate: { userId: actor.id, workDate } },
    include: { breakSessions: true },
  });
  if (!record?.clockInAt || record.clockOutAt) {
    return { success: false, error: "Clock in first." };
  }
  if (record.breakSessions.some((b) => !b.endedAt)) {
    return { success: false, error: "You're already on a break." };
  }

  await db.breakSession.create({
    data: { companyId: actor.companyId, attendanceRecordId: record.id, type: "SHORT", startedAt: new Date() },
  });

  revalidatePath("/attendance");
  return { success: true };
}

export async function endBreak(): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const workDate = workDateFor(new Date());

  const record = await db.attendanceRecord.findUnique({
    where: { userId_workDate: { userId: actor.id, workDate } },
    include: { breakSessions: true },
  });
  const openBreak = record?.breakSessions.find((b) => !b.endedAt);
  if (!openBreak) {
    return { success: false, error: "No break in progress." };
  }

  const now = new Date();
  const durationMinutes = Math.round((now.getTime() - openBreak.startedAt.getTime()) / 60000);
  await db.breakSession.update({ where: { id: openBreak.id }, data: { endedAt: now, durationMinutes } });

  revalidatePath("/attendance");
  return { success: true };
}

/**
 * The original record is never overwritten — this only adds a note and
 * flips status back to PENDING_REGULARISATION so an approver can review it.
 * The before/after audit entry is what makes this defensible later (§9.6).
 */
export async function requestRegularisation(input: RequestRegularisationInput): Promise<ActionResult> {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const parsed = requestRegularisationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const record = await db.attendanceRecord.findFirst({
    where: { id: parsed.data.attendanceRecordId, userId: actor.id },
  });
  if (!record) {
    return { success: false, error: "Attendance record not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.attendanceRecord.update({
      where: { id: record.id },
      data: {
        status: "PENDING_REGULARISATION",
        regularisationNote: parsed.data.note,
        approvedById: null,
        approvedAt: null,
      },
    });
    await recordAudit(tx, {
      actor,
      action: "attendance.regularisation_requested",
      entityType: "AttendanceRecord",
      entityId: record.id,
      beforeState: { status: record.status },
      afterState: { status: "PENDING_REGULARISATION", note: parsed.data.note },
    });
  });

  revalidatePath("/attendance/history");
  return { success: true };
}

export async function approveRegularisation(
  attendanceRecordId: string,
  approve: boolean,
): Promise<ActionResult> {
  const actor = await requirePermission("attendance.regularise");
  const filter = await scopeFilter(actor, "attendance.regularise");
  if (!filter) {
    return { success: false, error: "Not permitted." };
  }

  const record = await db.attendanceRecord.findFirst({
    where: { id: attendanceRecordId, status: "PENDING_REGULARISATION", ...filter },
    include: { user: { select: { departmentId: true } } },
  });
  if (!record) {
    return { success: false, error: "Nothing to approve here." };
  }

  const policy = await getEffectivePolicy(actor.companyId, record.user.departmentId);
  const newStatus = approve
    ? (record.netWorkMinutes ?? 0) >= policy.minFullDayMinutes
      ? "PRESENT"
      : "HALF_DAY"
    : "ABSENT";

  await db.$transaction(async (tx) => {
    await tx.attendanceRecord.update({
      where: { id: record.id },
      data: { status: newStatus, approvedById: actor.id, approvedAt: new Date(), isFlagged: false },
    });
    await recordAudit(tx, {
      actor,
      action: approve ? "attendance.regularisation_approved" : "attendance.regularisation_rejected",
      entityType: "AttendanceRecord",
      entityId: record.id,
      beforeState: { status: "PENDING_REGULARISATION", note: record.regularisationNote },
      afterState: { status: newStatus },
    });
  });

  revalidatePath("/attendance/history");
  return { success: true };
}
