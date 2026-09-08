"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideLeave } from "@/server/actions/leave.actions";

export function ApprovalActions({ leaveRequestId }: { leaveRequestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await decideLeave(leaveRequestId, decision);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(decision === "APPROVED" ? "Approved" : "Rejected");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide("REJECTED")}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        Reject
      </Button>
      <Button size="sm" disabled={isPending} onClick={() => decide("APPROVED")}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
      </Button>
    </div>
  );
}
