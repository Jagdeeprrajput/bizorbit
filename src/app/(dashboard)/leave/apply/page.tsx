import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { listLeaveTypes } from "@/server/queries/leave.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplyLeaveForm } from "./apply-form";

export default async function ApplyLeavePage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const leaveTypes = await listLeaveTypes(actor.companyId);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Apply for leave</CardTitle>
          <CardDescription>Weekends are excluded from the day count automatically.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <ApplyLeaveForm leaveTypes={leaveTypes} />
        </div>
      </Card>
    </div>
  );
}
