import { z } from "zod";

export const inviteEmployeeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["SUPER_ADMIN", "CEO", "CTO", "HR", "MANAGER", "EMPLOYEE"]),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  primaryOfficeId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
});

export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;

export const updateEmployeeDetailsSchema = z.object({
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  primaryOfficeId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  phone: z.string().optional(),
});
export type UpdateEmployeeDetailsInput = z.infer<typeof updateEmployeeDetailsSchema>;
