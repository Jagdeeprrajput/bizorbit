import { requirePermission } from "@/lib/auth/guards";
import { listDesignations, listDepartments } from "@/server/queries/organisation.queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DesignationFormDialog } from "./designation-form-dialog";

export default async function DesignationsPage() {
  const actor = await requirePermission("department.manage");
  const [designations, departments] = await Promise.all([
    listDesignations(actor.companyId),
    listDepartments(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Designations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Job titles, ordered by seniority level.</p>
        </div>
        <DesignationFormDialog departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No designations yet — create your first one above.
                </TableCell>
              </TableRow>
            ) : (
              designations.map((designation) => (
                <TableRow key={designation.id}>
                  <TableCell className="font-medium">{designation.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {designation.code}
                    </Badge>
                  </TableCell>
                  <TableCell>{designation.level}</TableCell>
                  <TableCell>{designation.department?.name ?? "All departments"}</TableCell>
                  <TableCell className="text-right">{designation._count.employees}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
