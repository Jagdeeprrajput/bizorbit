import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listEmployees } from "@/server/queries/employee.queries";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "./employee-table";

export default async function EmployeesPage() {
  const actor = await requirePermission("employee.read");
  const employees = await listEmployees();
  const canInvite = hasPermission(actor.role, "employee.create");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} {employees.length === 1 ? "person" : "people"}
          </p>
        </div>
        {canInvite && (
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="size-4" />
              Invite employee
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-8">
        <EmployeeTable employees={employees} />
      </div>
    </div>
  );
}
