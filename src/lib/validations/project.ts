import { z } from "zod";

export const projectStatuses = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(12, "Keep the code short"),
  description: z.string().optional(),
  ownerId: z.string().min(1, "Pick a project lead"),
  memberIds: z.array(z.string()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ownerId: z.string().min(1, "Pick a project lead"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const postProjectUpdateSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(projectStatuses),
  body: z.string().min(1, "Say something about the status"),
});
export type PostProjectUpdateInput = z.infer<typeof postProjectUpdateSchema>;
