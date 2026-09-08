"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideSale } from "@/server/actions/sales.actions";

export function SaleApprovalActions({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function decide(approve: boolean) {
    startTransition(async () => {
      const result = await decideSale(saleId, approve);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(approve ? "Approved" : "Rejected");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide(false)}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      </Button>
      <Button size="sm" disabled={isPending} onClick={() => decide(true)}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </Button>
    </div>
  );
}
