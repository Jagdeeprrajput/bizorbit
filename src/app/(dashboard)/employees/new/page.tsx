import { requirePermission } from "@/lib/auth/guards";
import { listDepartments, listOffices, listDesignations } from "@/server/queries/organisation.queries";
import { listManagerCandidates } from "@/server/queries/employee.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InviteForm } from "./invite-form";

export default async function NewEmployeePage() {
  const actor = await requirePermission("employee.create");

  const [departments, offices, managers, designations] = await Promise.all([
    listDepartments(actor.companyId),
    listOffices(actor.companyId),
    listManagerCandidates(actor.companyId),
    listDesignations(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Invite an employee</CardTitle>
          <CardDescription>
            They&apos;ll get an email to set their own password. No account is active until they do.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <InviteForm
            departments={departments}
            offices={offices}
            managers={managers}
            designations={designations.map((d) => ({ id: d.id, name: d.title }))}
            canAssignRole={actor.role === "SUPER_ADMIN"}
          />
        </div>
      </Card>
    </div>
  );
}
