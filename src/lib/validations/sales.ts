import { z } from "zod";

export const salesTargetMetrics = ["REVENUE", "UNITS", "DEALS"] as const;
export const salesTargetPeriods = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  commissionPercent: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
  assigneeIds: z.array(z.string()),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createSalesTargetSchema = z
  .object({
    assignTo: z.enum(["USER", "DEPARTMENT"]),
    userId: z.string().optional(),
    departmentId: z.string().optional(),
    metric: z.enum(salesTargetMetrics),
    targetValue: z.coerce.number().positive("Target must be greater than zero"),
    period: z.enum(salesTargetPeriods),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    notes: z.string().optional(),
  })
  .refine((data) => (data.assignTo === "USER" ? !!data.userId : !!data.departmentId), {
    message: "Choose who this target is for",
    path: ["userId"],
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type CreateSalesTargetInput = z.infer<typeof createSalesTargetSchema>;

export const updateSalesTargetSchema = z
  .object({
    targetValue: z.coerce.number().positive("Target must be greater than zero"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type UpdateSalesTargetInput = z.infer<typeof updateSalesTargetSchema>;

export const recordSaleSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  quantity: z.coerce.number().int().positive(),
  productId: z.string().optional(),
  targetId: z.string().optional(),
  saleDate: z.string().min(1, "Sale date is required"),
  source: z.string().optional(),
  notes: z.string().optional(),
});
export type RecordSaleInput = z.infer<typeof recordSaleSchema>;

export const updateSaleSchema = recordSaleSchema;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
