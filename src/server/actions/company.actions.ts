"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/server/services/audit.service";
import { updateCompanySchema, type UpdateCompanyInput } from "@/lib/validations/company";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateCompany(input: UpdateCompanyInput): Promise<ActionResult> {
  const actor = await requirePermission("settings.manage");
  const parsed = updateCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.company.findUniqueOrThrow({ where: { id: actor.companyId } });

  await db.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: actor.companyId },
      data: { ...parsed.data, logoUrl: parsed.data.logoUrl || null },
    });
    await recordAudit(tx, {
      actor,
      action: "company.settings_updated",
      entityType: "Company",
      entityId: actor.companyId,
      beforeState: {
        name: existing.name,
        timezone: existing.timezone,
        defaultCurrency: existing.defaultCurrency,
      },
      afterState: parsed.data,
      severity: "WARNING",
    });
  });

  revalidatePath("/admin/company");
  return { success: true };
}
