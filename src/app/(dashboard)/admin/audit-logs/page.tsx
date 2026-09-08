import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/server/db";
import { AuditLogTable } from "./audit-log-table";

export default async function AuditLogsPage() {
  const actor = await requirePermission("audit.read");

  const logs = await db.auditLog.findMany({
    where: { companyId: actor.companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Append-only. Nobody — including admins — can edit or delete these entries.
      </p>

      <div className="mt-8">
        <AuditLogTable logs={logs} />
      </div>
    </div>
  );
}
