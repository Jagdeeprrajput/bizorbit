import { z } from "zod";

export const clockInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative(),
});
export type ClockInInput = z.infer<typeof clockInSchema>;

export const clockOutSchema = clockInSchema;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
