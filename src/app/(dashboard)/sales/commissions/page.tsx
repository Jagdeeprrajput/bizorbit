import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getOwnCommissionStatement, getTeamCommissionSummary } from "@/server/queries/sales.queries";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";

export default async function CommissionsPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canSeeTeam = hasPermission(actor.role, "sales.approve");

  const [own, team] = await Promise.all([
    getOwnCommissionStatement(actor),
    canSeeTeam ? getTeamCommissionSummary(actor) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Commissions</h1>
      <p className="mt-1 text-sm text-muted-foreground">Earned on approved, product-linked sales.</p>

      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2">
        <RevealItem className="h-full">
          <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
            <CardHeader className="pb-2">
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="font-mono text-3xl font-semibold text-brand-text">
                <CountUp value={own.thisMonthTotal} prefix="₹" />
              </div>
            </CardContent>
          </Card>
        </RevealItem>
        <RevealItem className="h-full">
          <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
            <CardHeader className="pb-2">
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="font-mono text-3xl font-semibold">
                <CountUp value={own.allTimeTotal} prefix="₹" />
              </div>
            </CardContent>
          </Card>
        </RevealItem>
      </RevealGroup>

      {canSeeTeam && team.length > 0 && (
        <Reveal delay={0.05} className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Team commission summary</h2>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rep</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((rep) => (
                  <TableRow key={rep.employeeCode} className="transition-colors hover:bg-accent/40">
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell className="text-right">{rep.saleCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{rep.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      )}

      <h2 className="mt-10 mb-4 text-lg font-semibold">Your commission statement</h2>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {own.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No product-linked approved sales yet.
                </TableCell>
              </TableRow>
            ) : (
              own.lines.map(({ sale, commission }) => (
                <TableRow key={sale.id} className="transition-colors hover:bg-accent/40">
                  <TableCell>{new Date(sale.saleDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TableCell>
                  <TableCell>{sale.clientName}</TableCell>
                  <TableCell>{sale.product?.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{Number(sale.amount).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-brand-text">
                    ₹{commission.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
