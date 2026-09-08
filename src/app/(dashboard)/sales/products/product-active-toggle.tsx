"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleProductActive } from "@/server/actions/sales.actions";

export function ProductActiveToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleProductActive(productId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Product deactivated" : "Product reactivated");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={toggle}>
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isActive ? (
        <PowerOff className="size-3.5" />
      ) : (
        <Power className="size-3.5" />
      )}
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
