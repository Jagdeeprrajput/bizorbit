import { requirePermission } from "@/lib/auth/guards";
import { listDepartments } from "@/server/queries/organisation.queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DepartmentFormDialog } from "./department-form-dialog";

export default async function DepartmentsPage() {
  const actor = await requirePermission("department.manage");
  const departments = await listDepartments(actor.companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your org structure — employees are assigned a department on invite.
          </p>
        </div>
        <DepartmentFormDialog />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No departments yet — create your first one above.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {dept.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{dept._count.employees}</TableCell>
                  <TableCell>
                    <DepartmentFormDialog department={dept} />
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
