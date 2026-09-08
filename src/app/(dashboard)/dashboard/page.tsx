import Link from "next/link";
import {
  Fingerprint,
  CalendarCheck,
  KanbanSquare,
  Users,
  Bell,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/server/queries/dashboard.queries";
import { listUpcomingHolidays } from "@/server/queries/organisation.queries";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TargetGauge } from "@/components/charts/target-gauge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { filterNavByRole, type NavItem } from "@/components/layout/nav-config";

const attendanceLabel: Record<string, string> = {
  not_clocked_in: "Not clocked in",
  clocked_in: "Clocked in",
  clocked_out: "Done for today",
};

const attendanceAccent: Record<string, "good" | "warning" | "neutral"> = {
  not_clocked_in: "warning",
  clocked_in: "good",
  clocked_out: "neutral",
};

const quickActions: NavItem[] = [
  { label: "Clock in / out", href: "/attendance", icon: Fingerprint, roles: ["CEO", "CTO", "HR", "MANAGER", "EMPLOYEE"] },
  { label: "Apply for leave", href: "/leave/apply", icon: CalendarCheck },
  { label: "Log a sale", href: "/sales/entries", icon: TrendingUp },
  { label: "New task", href: "/tasks", icon: KanbanSquare },
];

export default async function DashboardPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const firstName = actor.name.split(" ")[0];
  const [summary, upcomingHolidays] = await Promise.all([
    getDashboardSummary(actor),
    listUpcomingHolidays(actor.companyId),
  ]);

  const statCards = [
    ...(actor.role !== "SUPER_ADMIN"
      ? [
          {
            icon: Fingerprint,
            label: "Attendance today",
            value: attendanceLabel[summary.attendanceStatus],
            accent: attendanceAccent[summary.attendanceStatus],
          },
        ]
      : []),
    {
      icon: CalendarCheck,
      label: summary.canApproveLeave ? "Awaiting your approval" : "Your pending leave",
      value: summary.pendingLeaveCount,
      accent: summary.pendingLeaveCount > 0 ? "warning" : "neutral",
    },
    {
      icon: KanbanSquare,
      label: "Your open tasks",
      value: summary.openTaskCount,
      accent: "brand",
    },
    ...(summary.teamCount !== null
      ? [{ icon: Users, label: "Team members", value: summary.teamCount, accent: "brand" as const }]
      : []),
  ] as const;

  const cardAccentClasses: Record<string, string> = {
    good: "bg-[var(--status-good)]/8 border-[var(--status-good)]/15",
    warning: "bg-[var(--status-warning)]/10 border-[var(--status-warning)]/20",
    neutral: "bg-secondary/60 border-border",
    brand: "bg-accent/70 border-[var(--brand-200)]",
  };
  const iconAccentClasses: Record<string, string> = {
    good: "bg-[var(--status-good)]/15 text-[var(--status-good)]",
    warning: "bg-[var(--status-warning)]/20 text-[var(--status-warning)]",
    neutral: "bg-card text-muted-foreground shadow-sm",
    brand: "bg-card text-brand-text shadow-sm",
  };

  const statGridCols: Record<number, string> = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  const visibleQuickActions = filterNavByRole(quickActions, actor.role);
  const quickActionsGridCols: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <div className="bg-noise relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-6 shadow-[var(--shadow-glow)]">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back, {firstName}</h1>
            <p className="mt-1 text-sm text-white/70">Here&apos;s what&apos;s happening today.</p>
          </div>
          <Badge variant="outline" className="relative border-white/25 bg-white/15 font-mono text-white">
            {actor.role}
          </Badge>
        </div>
      </Reveal>

      <RevealGroup className={`mt-8 grid gap-4 ${statGridCols[statCards.length] ?? "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {statCards.map(({ icon: Icon, label, value, accent }) => (
          <RevealItem key={label} className="h-full">
            <div
              className={`flex h-full flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] ${cardAccentClasses[accent]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconAccentClasses[accent]}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-auto pt-4 font-mono text-3xl font-semibold tracking-tight">
                {typeof value === "number" ? <CountUp value={value} /> : value}
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className={`grid gap-3 ${quickActionsGridCols[visibleQuickActions.length] ?? "grid-cols-2 sm:grid-cols-4"}`}>
              {visibleQuickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border px-3 py-4 text-center text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent text-brand-text transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {summary.primaryTarget && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Your active sales target
                  {summary.primaryTarget.progress.percentAchieved >= 100 && (
                    <Sparkles className="size-4 text-[var(--status-good)]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-around">
                <TargetGauge
                  percent={summary.primaryTarget.progress.percentAchieved}
                  health={summary.primaryTarget.progress.health}
                  label={`${summary.primaryTarget.progress.daysRemaining} day(s) left`}
                />
                <div className="mt-4 text-center sm:mt-0 sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    {summary.primaryTarget.target.metric} · {summary.primaryTarget.target.period}
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold">
                    <CountUp value={summary.primaryTarget.progress.achieved} /> /{" "}
                    {summary.primaryTarget.progress.targetValue.toLocaleString("en-IN")}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/sales">
                      View sales
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Recent notifications</CardTitle>
              <Bell className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.notifications.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
              ) : (
                summary.notifications.map((n) => (
                  <div key={n.id} className={`rounded-md px-3 py-2 text-sm ${n.isRead ? "" : "bg-accent/40"}`}>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                ))
              )}
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/notifications">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {upcomingHolidays.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Upcoming holidays</CardTitle>
                <PartyPopper className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-1">
                {upcomingHolidays.map((holiday) => {
                  const date = new Date(holiday.date);
                  return (
                    <div key={holiday.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent">
                        <span className="text-[10px] font-medium uppercase text-brand-text">
                          {date.toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                        <span className="text-sm font-semibold leading-none text-brand-text">{date.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("en-IN", { weekday: "long" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </Reveal>
      </div>
    </div>
  );
}
