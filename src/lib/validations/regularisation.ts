import { z } from "zod";

export const requestRegularisationSchema = z.object({
  attendanceRecordId: z.string().min(1),
  note: z.string().min(10, "Explain what happened (at least 10 characters)"),
});
export type RequestRegularisationInput = z.infer<typeof requestRegularisationSchema>;
