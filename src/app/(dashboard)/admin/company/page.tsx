import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/server/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompanyForm } from "./company-form";

export default async function CompanySettingsPage() {
  const actor = await requirePermission("settings.manage");
  const company = await db.company.findUniqueOrThrow({ where: { id: actor.companyId } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Company settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set once at bootstrap — change here without touching the database directly.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Affects date/time display, week numbering, and fiscal reporting.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <CompanyForm
            company={{
              name: company.name,
              logoUrl: company.logoUrl ?? "",
              timezone: company.timezone,
              weekStartsOn: company.weekStartsOn,
              fiscalYearStart: company.fiscalYearStart,
              defaultCurrency: company.defaultCurrency,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
