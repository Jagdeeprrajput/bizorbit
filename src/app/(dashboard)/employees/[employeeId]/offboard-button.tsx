"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { offboardEmployee } from "@/server/actions/employee.actions";

export function OffboardButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await offboardEmployee(userId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name} has been offboarded — every session is revoked.`);
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <UserX className="size-4" />
          Offboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offboard {name}?</DialogTitle>
          <DialogDescription>
            This revokes every active session instantly — their next request fails
            immediately, not whenever a token happens to expire. Their history is kept,
            not deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={confirm}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm offboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
