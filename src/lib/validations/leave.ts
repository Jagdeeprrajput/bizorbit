import { z } from "zod";

export const leaveAccrualMethods = ["ANNUAL_UPFRONT", "MONTHLY_ACCRUAL", "NONE"] as const;

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(12, "Keep the code short"),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #ed7014"),
  isPaid: z.boolean(),
  annualQuotaDays: z.coerce.number().min(0, "Must be 0 or more"),
  accrualMethod: z.enum(leaveAccrualMethods),
  allowCarryForward: z.boolean(),
  maxCarryForwardDays: z.coerce.number().min(0),
  requiresDocumentAfterDays: z.coerce.number().int().min(0),
  minNoticeDays: z.coerce.number().int().min(0),
  maxConsecutiveDays: z.coerce.number().int().min(0),
  allowHalfDay: z.boolean(),
  deductsFromBalance: z.boolean(),
});
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;

export const applyLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Choose a leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
