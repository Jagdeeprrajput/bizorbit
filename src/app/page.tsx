import Link from "next/link";
import {
  Fingerprint,
  CalendarCheck,
  KanbanSquare,
  ShieldCheck,
  History,
  Users,
  MapPin,
  BellRing,
  FileSpreadsheet,
  Lock,
  Server,
  MonitorSmartphone,
  GitBranch,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { HeroOrbs } from "@/components/marketing/hero-orbs";
import { ClockWidgetPreview } from "@/components/marketing/clock-widget-preview";

const modules = [
  {
    icon: Fingerprint,
    title: "Attendance & geofencing",
    description:
      "Clock in and out with GPS, IP, and device signals captured on every punch. The server — never the browser — decides whether you were inside the office radius, using the Haversine distance formula against each office's geofence.",
    points: [
      "Late/early/overtime computed automatically against shift policy",
      "Breaks tracked with a running daily cap",
      "Anomalies (impossible travel, IP/GPS mismatch) flagged for HR review, not silently blocked",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Leave & multi-stage approvals",
    description:
      "The full approval chain — Manager → HR, or further up for long or unpaid leave — is written to the database the moment a request is submitted, so a mid-flight org change can never rewrite who's supposed to sign off.",
    points: [
      "Balances computed live: allocated + carried forward − used − pending",
      "Row-level locking prevents two requests from double-spending the same balance",
      "Approval, rejection, and balance updates happen in one all-or-nothing transaction",
    ],
  },
  {
    icon: KanbanSquare,
    title: "Tasks & collaboration",
    description:
      "Assign work across your reporting line, track it on a kanban board or list, and never lose the history of who changed what.",
    points: [
      "Threaded comments with @mentions and file attachments",
      "Every status change writes a readable activity timeline entry",
      "Deadline reminders at 48h, 24h, and daily once overdue",
    ],
  },
  {
    icon: FileSpreadsheet,
    title: "Reports & exports",
    description:
      "Attendance, leave, and task reports filtered by team, department, or date range — exportable to CSV, Excel, or PDF, with every export itself written to the audit log.",
    points: [
      "Scoped to what your role is allowed to see — self, team, department, or company",
      "Row counts logged so large exports can't happen quietly",
    ],
  },
  {
    icon: BellRing,
    title: "Notifications",
    description:
      "One function decides in-app or email delivery per person, per category — so adding a new channel later means changing one place, not thirty call sites.",
    points: [
      "Email delivery uses a transactional outbox — queued in the same transaction as the change that caused it",
      "Security notifications can never be muted",
    ],
  },
  {
    icon: History,
    title: "Immutable audit log",
    description:
      "Every approval, edit, role change, and export is recorded — who, what, when, from where, before and after. Append-only, and nobody, including admins, can edit it.",
    points: [
      "Database permissions physically block UPDATE/DELETE on the log table",
      "Critical-severity events retained for 7 years",
    ],
  },
];

const architectureLayers = [
  {
    icon: MonitorSmartphone,
    title: "Browser",
    detail: "Forms, maps, dialogs. Assumed hostile — nothing here is trusted.",
  },
  {
    icon: GitBranch,
    title: "proxy.ts",
    detail: "A cheap cookie-presence check and security headers. No permission logic lives here.",
  },
  {
    icon: Server,
    title: "Server actions & services",
    detail: "Session resolved, input validated, permission and scope checked, on every single request.",
  },
  {
    icon: Lock,
    title: "PostgreSQL",
    detail: "The scope filter is a WHERE clause, not a UI filter — a crafted request for someone else's record returns nothing.",
  },
];

const roles = [
  { name: "SUPER_ADMIN", scope: "Everything, including security settings and the audit log" },
  { name: "CEO", scope: "Full read access; final approver for senior leave and policy" },
  { name: "CTO", scope: "Full read access; approver for technology-department chains" },
  { name: "HR", scope: "Employee lifecycle, all leave, all attendance — not security settings" },
  { name: "MANAGER", scope: "Full authority over direct and indirect reports only" },
  { name: "EMPLOYEE", scope: "Own data, plus a read-only directory of colleagues" },
];

const stats = [
  { value: "6", label: "roles, each independently scoped" },
  { value: "12", label: "modules, one vertical slice each" },
  { value: "0", label: "public sign-up forms — invite only" },
  { value: "100%", label: "of permission checks re-run on the server" },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">
            Biz<span className="text-brand-text">Orbit</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="#modules" className="transition-colors hover:text-foreground">
              Modules
            </Link>
            <Link href="#security" className="transition-colors hover:text-foreground">
              Security
            </Link>
            <Link href="#roles" className="transition-colors hover:text-foreground">
              Roles
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------------------------------------------------- Hero */}
        <section className="relative isolate overflow-hidden">
          <HeroOrbs />
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <Reveal>
              <Badge variant="secondary" className="mb-6">
                Internal workforce platform · invite-only
              </Badge>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Attendance, leave, and tasks —
                <span className="text-brand-text"> run like one system.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance">
                BizOrbit is your company&apos;s workforce system of record: GPS-verified
                clock-ins, approval chains that can&apos;t be rewritten mid-flight, and an
                audit log nobody — not even an admin — can edit. Built for six roles,
                each scoped to exactly what they&apos;re allowed to touch.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Sign in to BizOrbit
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#modules">Explore the modules</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                No public sign-up. Accounts are created by HR or an admin and verified by email.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <ClockWidgetPreview />
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------- Stats strip */}
        <section className="border-y border-border bg-secondary/40">
          <RevealGroup className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
            {stats.map((stat) => (
              <RevealItem key={stat.label} className="text-center sm:text-left">
                <div className="font-mono text-3xl font-semibold text-brand-text">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground text-balance">{stat.label}</div>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* ---------------------------------------------------------- Modules */}
        <section id="modules" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Six modules, deep dive
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything HR needs, without the spreadsheets
            </h2>
            <p className="mt-4 text-muted-foreground text-balance">
              Twelve modules in total, each a self-contained vertical slice — its own
              routes, components, service layer, and validation schemas. Here are the
              six your team will touch daily.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ icon: Icon, title, description, points }) => (
              <RevealItem key={title}>
                <Card className="h-full transition-shadow hover:shadow-[var(--shadow-lg)]">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="size-5 text-accent-foreground" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="text-balance">{description}</CardDescription>
                    <ul className="mt-4 space-y-2">
                      {points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-text" />
                          <span className="text-balance">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardHeader>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <Separator />

        {/* ---------------------------------------------------------- GPS honesty section */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <Badge variant="secondary" className="mb-4">
                <MapPin className="mr-1 size-3" />
                The honest constraint
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                GPS is evidence, not enforcement — and we say so out loud.
              </h2>
              <p className="mt-4 text-muted-foreground text-balance">
                Browser GPS can be spoofed in about fifteen seconds with Chrome DevTools.
                Any vendor who claims web-based location attendance is tamper-proof is
                selling you something. BizOrbit collects a rich, tamper-evident signal
                bundle instead, and flags anomalies for a human to review.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "GPS accuracy radius — a weak signal is treated as unreliable, not fraud",
                  "IP address cross-checked against GPS location",
                  "Device, OS, and timezone fingerprint on every punch",
                  "Server timestamp always — never the browser's clock",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-text" />
                    <span className="text-balance">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <Card className="bg-secondary/40">
                <CardHeader>
                  <CardTitle className="text-base">Flagged, not blocked</CardTitle>
                  <CardDescription>
                    An anomaly never stops someone from clocking in — it surfaces on the
                    HR review queue instead.
                  </CardDescription>
                </CardHeader>
                <div className="space-y-3 px-6 pb-6">
                  {[
                    ["Impossible travel", "Bengaluru at 09:00, Delhi at 11:00"],
                    ["IP / GPS mismatch", "Office IP range, GPS 4.2 km away"],
                    ["Suspiciously perfect GPS", "0.0m accuracy — a synthetic value"],
                    ["New device", "Never seen for this employee before"],
                  ].map(([label, detail]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>
        </section>

        <Separator />

        {/* ---------------------------------------------------------- Security architecture */}
        <section id="security" className="mx-auto w-full max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              <ShieldCheck className="mr-1 size-3" />
              Security model
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The browser is a display surface, never an authority
            </h2>
            <p className="mt-4 text-muted-foreground text-balance">
              If the UI hides an &quot;Approve&quot; button for a regular employee, that&apos;s a
              convenience — not a security control. Every request is re-checked, at every
              layer, on the server.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {architectureLayers.map(({ icon: Icon, title, detail }, i) => (
              <RevealItem key={title} className="relative">
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="size-5 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-balance">{detail}</CardDescription>
                  </CardHeader>
                </Card>
                {i < architectureLayers.length - 1 && (
                  <ArrowRight className="absolute top-1/2 -right-3 hidden size-5 -translate-y-1/2 text-muted-foreground lg:block" />
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <Separator />

        {/* ---------------------------------------------------------- Roles */}
        <section id="roles" className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <Badge variant="secondary" className="mb-4">
                <Users className="mr-1 size-3" />
                Role & scope model
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Six roles. Every one of them scoped, not just gated.
              </h2>
              <p className="mt-4 text-muted-foreground text-balance">
                Holding a permission isn&apos;t enough — a manager who can approve leave
                can only approve it for their own reporting line. The scope is applied
                as a database filter, so a hand-crafted request for another team&apos;s
                record gets back nothing, because the row was never fetched.
              </p>
              <p className="mt-4 text-sm text-muted-foreground text-balance">
                HR can&apos;t grant roles, and Super Admin is the only one who can — so a
                single compromised HR account can never promote itself to the top.
              </p>
            </Reveal>
            <RevealGroup className="grid gap-3">
              {roles.map((role) => (
                <RevealItem key={role.name}>
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-card px-5 py-4">
                    <Badge className="mt-0.5 font-mono">{role.name}</Badge>
                    <p className="text-sm text-muted-foreground text-balance">{role.scope}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        <Separator />

        {/* ---------------------------------------------------------- CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <Reveal>
            <Card className="overflow-hidden bg-primary text-primary-foreground">
              <CardHeader className="items-center gap-4 py-16 text-center">
                <CardTitle className="text-3xl font-semibold text-balance sm:text-4xl">
                  Your account is created by HR, not by you.
                </CardTitle>
                <CardDescription className="max-w-lg text-primary-foreground/80 text-balance">
                  Check your inbox for an invite, or sign in if you&apos;ve already set your password.
                </CardDescription>
                <Button asChild size="lg" variant="secondary" className="mt-4">
                  <Link href="/login">
                    Sign in to BizOrbit
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
          <div>
            <span className="text-lg font-semibold tracking-tight">
              Biz<span className="text-brand-text">Orbit</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground text-balance">
              A single Next.js application where the server enforces every rule and
              PostgreSQL stores the truth.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Modules</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Attendance & geofencing</li>
              <li>Leave & approvals</li>
              <li>Tasks & collaboration</li>
              <li>Reports & exports</li>
              <li>Notifications</li>
              <li>Audit log</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Security</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Database-backed sessions, instantly revocable</li>
              <li>Scrypt password hashing, 12-char minimum</li>
              <li>Immutable, append-only audit log</li>
              <li>Invite-only — no public sign-up</li>
            </ul>
          </div>
        </div>
        <Separator />
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} BizOrbit</span>
          <span>Internal use only</span>
        </div>
      </footer>
    </div>
  );
}
