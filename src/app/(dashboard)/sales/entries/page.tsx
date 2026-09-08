import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listOwnSales, listPendingSales, listProducts, listMyTargets } from "@/server/queries/sales.queries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleFormDialog } from "./sale-form-dialog";
import { SaleApprovalActions } from "./sale-approval-actions";
import { DeleteSaleButton } from "./delete-sale-button";

const statusVariant: Record<string, "success" | "warning" | "critical"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "critical",
};

export default async function SalesEntriesPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canApprove = hasPermission(actor.role, "sales.approve");

  const [sales, pending, products, myTargets] = await Promise.all([
    listOwnSales(actor),
    canApprove ? listPendingSales(actor) : Promise.resolve([]),
    listProducts(actor.companyId),
    listMyTargets(actor),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sales entries</h1>
        <SaleFormDialog
          products={products.map((p) => ({ id: p.id, name: p.name }))}
          targets={myTargets.map(({ target }) => ({ id: target.id, metric: target.metric, period: target.period }))}
        />
      </div>

      {canApprove && (
        <div id="pending" className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Pending approval</h2>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting on you.</p>
            ) : (
              pending.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {sale.user.name} <span className="text-muted-foreground">· {sale.clientName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{Number(sale.amount).toLocaleString("en-IN")}
                      {sale.product && <> · {sale.product.name}</>} ·{" "}
                      {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <SaleApprovalActions saleId={sale.id} />
                </div>
              ))
            )}
          </div>
          <Separator className="my-8" />
        </div>
      )}

      <h2 className="mb-4 mt-8 text-lg font-semibold">Your sales</h2>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No sales logged yet.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className="transition-colors hover:bg-accent/40">
                  <TableCell>{new Date(sale.saleDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TableCell>
                  <TableCell>{sale.clientName}</TableCell>
                  <TableCell>{sale.product?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono">₹{Number(sale.amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[sale.status]}>{sale.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <SaleFormDialog
                          products={products.map((p) => ({ id: p.id, name: p.name }))}
                          targets={myTargets.map(({ target }) => ({ id: target.id, metric: target.metric, period: target.period }))}
                          sale={{ ...sale, amount: Number(sale.amount) }}
                        />
                        <DeleteSaleButton saleId={sale.id} />
                      </div>
                    )}
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
