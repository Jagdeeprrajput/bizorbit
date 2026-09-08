import { z } from "zod";

export const weekdayOptions = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export const createAttendancePolicySchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean(),
  shiftStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format"),
  shiftEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format"),
  graceMinutes: z.coerce.number().int().min(0),
  minFullDayMinutes: z.coerce.number().int().positive(),
  minHalfDayMinutes: z.coerce.number().int().positive(),
  maxBreakMinutesPerDay: z.coerce.number().int().min(0),
  workingDays: z.array(z.enum(weekdayOptions)),
  requireGeofence: z.boolean(),
  allowRemoteClockIn: z.boolean(),
  appliesToDepartmentId: z.string().optional(),
});
export type CreateAttendancePolicyInput = z.infer<typeof createAttendancePolicySchema>;
