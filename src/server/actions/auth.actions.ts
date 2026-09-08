"use server";

import { headers } from "next/headers";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/server/db";
import { auth } from "@/lib/auth/auth";
import { bootstrapAdminSchema, type BootstrapAdminInput } from "@/lib/validations/auth";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * One-time setup: creates the company and its first Super Admin. Only
 * callable while no company exists yet — see blueprint §8.2. After this,
 * every other account is created by HR/Admin through the invite flow
 * (Phase 5), never through a public form.
 */
export async function bootstrapCompany(input: BootstrapAdminInput): Promise<ActionResult> {
  const parsed = bootstrapAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { companyName, firstName, lastName, email, password } = parsed.data;

  const existingCompany = await db.company.findFirst({ select: { id: true } });
  if (existingCompany) {
    return { success: false, error: "Setup has already been completed. Please sign in instead." };
  }

  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const passwordHash = await hashPassword(password);

  await db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: companyName, slug },
    });

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        email,
        emailVerified: true,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        employeeCode: "BZO-0001",
      },
    });

    await tx.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        issuer: "local:credential",
        accountId: user.id,
        password: passwordHash,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "company.bootstrap",
        entityType: "Company",
        entityId: company.id,
        severity: "CRITICAL",
      },
    });

    // Starter leave types so "apply for leave" works immediately — a full
    // policy/quota admin UI is a later phase (blueprint §10, module 5).
    const defaultLeaveTypes = [
      { name: "Annual Leave", code: "ANNUAL", annualQuotaDays: 18, isPaid: true },
      { name: "Sick Leave", code: "SICK", annualQuotaDays: 10, isPaid: true },
      { name: "Casual Leave", code: "CASUAL", annualQuotaDays: 6, isPaid: true },
    ];
    for (const type of defaultLeaveTypes) {
      await tx.leaveType.create({ data: { companyId: company.id, ...type } });
    }
  });

  await auth.api.signInEmail({
    body: { email, password },
    headers: await headers(),
  });

  return { success: true };
}
