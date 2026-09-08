import { notFound } from "next/navigation";
import { getEmployeeById, listManagerCandidates } from "@/server/queries/employee.queries";
import { getEmployeeSalesSummary } from "@/server/queries/sales.queries";
import { listDepartments, listDesignations, listOffices } from "@/server/queries/organisation.queries";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TargetGauge } from "@/components/charts/target-gauge";
import { OffboardButton } from "./offboard-button";
import { EditEmployeeDialog } from "./edit-employee-dialog";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const employee = await getEmployeeById(employeeId);

  if (!employee) {
    notFound();
  }

  const canOffboard =
    hasPermission(actor.role, "employee.offboard") && employee.id !== actor.id && employee.status !== "OFFBOARDED";
  const canEdit = hasPermission(actor.role, "employee.update");
  const canSeeSales = hasPermission(actor.role, "sales.read");
  const salesSummary = canSeeSales ? await getEmployeeSalesSummary(employee.id) : null;

  const [departments, designations, offices, managers] = canEdit
    ? await Promise.all([
        listDepartments(actor.companyId),
        listDesignations(actor.companyId),
        listOffices(actor.companyId),
        listManagerCandidates(actor.companyId),
      ])
    : [[], [], [], []];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{initials(employee.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.employeeCode} · {employee.email}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="font-mono">{employee.role}</Badge>
          <Badge variant="secondary">{employee.status}</Badge>
          {canEdit && (
            <EditEmployeeDialog
              userId={employee.id}
              departments={departments}
              designations={designations.map((d) => ({ id: d.id, name: d.title }))}
              offices={offices}
              managers={managers}
              defaultValues={{
                departmentId: employee.department?.id,
                designationId: employee.designation?.id,
                managerId: employee.manager?.id,
                primaryOfficeId: employee.primaryOffice?.id,
                employmentType: employee.employmentType,
                workMode: employee.workMode,
                phone: employee.phone ?? "",
              }}
            />
          )}
          {canOffboard && <OffboardButton userId={employee.id} name={employee.name} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Field label="Department" value={employee.department?.name} />
            <Field label="Designation" value={employee.designation?.title} />
            <Field label="Manager" value={employee.manager?.name} />
            <Field label="Primary office" value={employee.primaryOffice?.name} />
            <Field label="Employment type" value={employee.employmentType.replace("_", " ")} />
            <Field label="Work mode" value={employee.workMode} />
          </dl>
        </CardContent>
      </Card>

      {salesSummary && (salesSummary.targets.length > 0 || salesSummary.approvedSalesCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales performance</CardTitle>
            <CardDescription>{salesSummary.approvedSalesCount} approved sale(s) all time</CardDescription>
          </CardHeader>
          <CardContent>
            {salesSummary.targets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active target right now.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {salesSummary.targets.map(({ target, progress }) => (
                  <div key={target.id} className="flex flex-col items-center">
                    <TargetGauge
                      percent={progress.percentAchieved}
                      health={progress.health}
                      label={`${target.metric} · ${target.period}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {employee.directReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Direct reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employee.directReports.map((report) => (
                <div key={report.id}>
                  <Separator className="mb-2 first:hidden" />
                  <p className="text-sm">
                    {report.name} <span className="text-muted-foreground">· {report.employeeCode}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
