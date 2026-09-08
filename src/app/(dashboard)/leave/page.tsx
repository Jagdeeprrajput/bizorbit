import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listOwnBalances, listOwnLeaveRequests } from "@/server/queries/leave.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevealGroup, RevealItem, Reveal } from "@/components/motion/reveal";
import { DonutChart } from "@/components/charts/donut-chart";

const statusVariant: Record<string, "success" | "warning" | "critical" | "outline"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "critical",
  CANCELLED: "outline",
  WITHDRAWN: "outline",
  DRAFT: "outline",
};

export default async function LeavePage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const [balances, requests] = await Promise.all([listOwnBalances(actor), listOwnLeaveRequests(actor)]);
  const canApprove = hasPermission(actor.role, "leave.approve");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
        <div className="flex gap-2">
          {canApprove && (
            <Button asChild variant="outline">
              <Link href="/leave/approvals">Approvals</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/leave/apply">
              <Plus className="size-4" />
              Apply for leave
            </Link>
          </Button>
        </div>
      </div>

      {balances.some((b) => b.available > 0 || b.used > 0) && (
        <Reveal className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available leave by type</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                segments={balances
                  .filter((b) => b.available > 0)
                  .map((b) => ({ label: b.leaveType.name, value: b.available, color: b.leaveType.colorHex }))}
                centerValue={balances.reduce((sum, b) => sum + Math.max(0, b.available), 0)}
                centerLabel="days left"
              />
            </CardContent>
          </Card>
        </Reveal>
      )}

      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-3">
        {balances.map(({ leaveType, available, used, pending }) => (
          <RevealItem key={leaveType.id} className="h-full">
            <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: leaveType.colorHex }} />
                  <CardTitle className="text-sm font-medium">{leaveType.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="font-mono text-2xl font-semibold">{available}</div>
                <p className="text-xs text-muted-foreground">
                  days left · {used} used, {pending} pending
                </p>
              </CardContent>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>

      <h2 className="mt-10 text-lg font-semibold">Your requests</h2>
      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No leave requests yet.</p>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="text-sm font-medium">{request.leaveType.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} –{" "}
                  {new Date(request.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} ·{" "}
                  {Number(request.totalDays)} day(s)
                </p>
              </div>
              <Badge variant={statusVariant[request.status] ?? "secondary"}>{request.status}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
