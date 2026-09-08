import "server-only";
import { db } from "@/server/db";
import type { AppUser } from "@/lib/auth/guards";
import type { Prisma } from "@/generated/prisma/client";

type RecordAuditInput = {
  actor: AppUser;
  action: string;
  entityType: string;
  entityId: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
};

/** Always call from inside the same transaction as the change it records (§13.4). */
export async function recordAudit(
  tx: Prisma.TransactionClient | typeof db,
  input: RecordAuditInput,
) {
  await tx.auditLog.create({
    data: {
      companyId: input.actor.companyId,
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      severity: input.severity ?? "INFO",
      beforeState: input.beforeState,
      afterState: input.afterState,
    },
  });
}
