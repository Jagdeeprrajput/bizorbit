import { requirePermission } from "@/lib/auth/guards";
import { listTeamTargets } from "@/server/queries/sales.queries";
import { listAssignableUsers } from "@/server/queries/task.queries";
import { listDepartments } from "@/server/queries/organisation.queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TargetFormDialog } from "./target-form-dialog";
import { EditTargetDialog, CancelTargetButton } from "./edit-target-dialog";

export default async function SalesTargetsPage() {
  const actor = await requirePermission("sales.target.manage");
  const [targets, employees, departments] = await Promise.all([
    listTeamTargets(actor),
    listAssignableUsers(actor.companyId),
    listDepartments(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales targets</h1>
          <p className="mt-1 text-sm text-muted-foreground">{targets.length} active target(s)</p>
        </div>
        <TargetFormDialog
          employees={employees}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assigned to</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Days left</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No targets yet — create your first one above.
                </TableCell>
              </TableRow>
            ) : (
              targets.map(({ target, progress }) => (
                <TableRow key={target.id} className="transition-colors hover:bg-accent/40">
                  <TableCell className="font-medium">
                    {target.user?.name ?? target.department?.name ?? "—"}
                  </TableCell>
                  <TableCell>{target.metric}</TableCell>
                  <TableCell>{target.period}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: `var(--status-${progress.health})`, color: "white" }}>
                      {Math.round(progress.percentAchieved)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{progress.daysRemaining}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditTargetDialog target={{ ...target, targetValue: Number(target.targetValue) }} />
                      <CancelTargetButton targetId={target.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
