import Link from "next/link";
import { Fingerprint, CalendarCheck, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

const reports = [
  {
    href: "/reports/attendance",
    icon: Fingerprint,
    title: "Attendance report",
    description: "Present/absent/late days and average hours per employee, for any date range.",
  },
  {
    href: "/reports/leave",
    icon: CalendarCheck,
    title: "Leave report",
    description: "Approved leave usage by type and employee, for any date range.",
  },
  {
    href: "/sales/commissions",
    icon: TrendingUp,
    title: "Sales & commission report",
    description: "Target achievement and commission statements — already on the Sales module.",
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Filterable, exportable to CSV or PDF.</p>

      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2">
        {reports.map(({ href, icon: Icon, title, description }) => (
          <RevealItem key={href}>
            <Link href={href}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-lg)]">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent">
                    <Icon className="size-5 text-accent-foreground" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {title}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
