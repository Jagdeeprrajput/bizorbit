import { z } from "zod";

export const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export const updateCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.union([z.string().url("Enter a valid URL"), z.literal("")]),
  timezone: z.string().min(1, "Timezone is required"),
  weekStartsOn: z.enum(weekdays),
  fiscalYearStart: z.coerce.number().int().min(1).max(12),
  defaultCurrency: z.string().min(1, "Currency is required").max(3),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
