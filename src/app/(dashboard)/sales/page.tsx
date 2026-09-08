import Link from "next/link";
import { Trophy, Plus, Target, Package, ClipboardCheck, Wallet } from "lucide-react";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listMyTargets, listTeamTargets, getLeaderboard } from "@/server/queries/sales.queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TargetGauge } from "@/components/charts/target-gauge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";

const metricLabel: Record<string, string> = { REVENUE: "₹", UNITS: "units", DEALS: "deals" };

const medalColor = ["text-amber-500", "text-zinc-400", "text-amber-700"];

export default async function SalesPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canManage = hasPermission(actor.role, "sales.target.manage");
  const canApprove = hasPermission(actor.role, "sales.approve");

  const [myTargets, teamTargets, leaderboard] = await Promise.all([
    listMyTargets(actor),
    listTeamTargets(actor),
    getLeaderboard(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">Targets, products, and this month&apos;s leaderboard.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/sales/entries">
              <Plus className="size-4" />
              Log a sale
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sales/commissions">
              <Wallet className="size-4" />
              Commissions
            </Link>
          </Button>
          {canApprove && (
            <Button asChild variant="outline">
              <Link href="/sales/entries#pending">
                <ClipboardCheck className="size-4" />
                Approvals
              </Link>
            </Button>
          )}
          {canManage && (
            <>
              <Button asChild variant="outline">
                <Link href="/sales/products">
                  <Package className="size-4" />
                  Products
                </Link>
              </Button>
              <Button asChild>
                <Link href="/sales/targets">
                  <Target className="size-4" />
                  Manage targets
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Your targets</h2>
          {myTargets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active target right now.
              </CardContent>
            </Card>
          ) : (
            <RevealGroup className="grid gap-4 sm:grid-cols-2">
              {myTargets.map(({ target, progress }) => (
                <RevealItem key={target.id} className="h-full">
                  <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {target.metric} · {target.period}
                      </CardTitle>
                      <CardDescription>
                        {progress.achieved.toLocaleString("en-IN")} / {progress.targetValue.toLocaleString("en-IN")}{" "}
                        {metricLabel[target.metric]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col items-center justify-center">
                      <TargetGauge
                        percent={progress.percentAchieved}
                        health={progress.health}
                        label={`${progress.daysRemaining} day(s) left`}
                      />
                    </CardContent>
                  </Card>
                </RevealItem>
              ))}
            </RevealGroup>
          )}

          {teamTargets.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">Team targets</h2>
              <div className="space-y-3">
                {teamTargets.map(({ target, progress }) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {target.user?.name ?? target.department?.name ?? "Unassigned"}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {target.metric} · {target.period}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {progress.achieved.toLocaleString("en-IN")} / {progress.targetValue.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: `var(--status-${progress.health})`,
                        color: "white",
                      }}
                    >
                      {Math.round(progress.percentAchieved)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Reveal>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="size-4 text-amber-500" />
            This month&apos;s leaderboard
          </h2>
          <Card>
            <CardContent className="space-y-1">
              {leaderboard.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No approved sales yet.</p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.employeeCode}
                    className="flex items-center justify-between rounded-md px-2 py-2 odd:bg-secondary/40 transition-colors hover:bg-accent/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 text-sm font-bold ${medalColor[index] ?? "text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                      <span className="text-sm">{entry.name}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      <CountUp value={entry.total} prefix="₹" />
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
