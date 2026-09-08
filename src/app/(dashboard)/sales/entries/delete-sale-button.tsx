"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { deleteSale } from "@/server/actions/sales.actions";

export function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteSale(saleId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Sale deleted");
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this sale?</DialogTitle>
          <DialogDescription>This removes the pending sale entry entirely. This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={confirmDelete}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Delete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
