import { requirePermission } from "@/lib/auth/guards";
import { listAllProducts } from "@/server/queries/sales.queries";
import { listAssignableUsers } from "@/server/queries/task.queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductActiveToggle } from "./product-active-toggle";

export default async function ProductsPage() {
  const actor = await requirePermission("product.manage");
  const [products, users] = await Promise.all([
    listAllProducts(actor.companyId),
    listAssignableUsers(actor.companyId),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products &amp; services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.filter((p) => p.isActive).length} active · {products.length} total
          </p>
        </div>
        <ProductFormDialog users={users} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="col-span-full py-16 text-center text-muted-foreground">
            No products yet — create your first one above.
          </p>
        ) : (
          products.map((product) => (
            <Card
              key={product.id}
              className={`h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] ${
                product.isActive ? "" : "opacity-60"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {product.sku}
                  </Badge>
                  <span className="font-mono text-sm font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</span>
                </div>
                <CardTitle className="mt-2 flex items-center gap-2">
                  {product.name}
                  {!product.isActive && (
                    <Badge variant="outline" className="text-[10px]">
                      Inactive
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{product.category || "Uncategorised"}</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {Number(product.commissionPercent)}% commission · {product.assignments.length} rep(s) assigned
                </p>
                <div className="mt-auto flex gap-2 pt-3">
                  <ProductFormDialog
                    users={users}
                    product={{ ...product, price: Number(product.price), commissionPercent: Number(product.commissionPercent) }}
                  />
                  <ProductActiveToggle productId={product.id} isActive={product.isActive} />
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
