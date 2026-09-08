import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(12, "Keep the code short"),
  description: z.string().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const createDesignationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required").max(12, "Keep the code short"),
  level: z.coerce.number().int().min(1, "Level must be 1 or higher"),
  departmentId: z.string().optional(),
});
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

export const holidayTypes = ["PUBLIC", "COMPANY", "OPTIONAL", "RESTRICTED"] as const;

export const createHolidaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(holidayTypes),
  description: z.string().optional(),
  isRecurring: z.boolean(),
});
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

export const createOfficeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  geofenceRadiusMeters: z.coerce.number().int().positive().default(150),
  timezone: z.string().min(1, "Timezone is required").default("Asia/Kolkata"),
});
export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;
