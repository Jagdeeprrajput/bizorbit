"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setLeaveTypeActive } from "@/server/actions/leave.actions";

export function LeaveTypeActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onChange(checked: boolean) {
    startTransition(async () => {
      const result = await setLeaveTypeActive(id, checked);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(checked ? "Leave type activated" : "Leave type deactivated");
      router.refresh();
    });
  }

  return <Switch size="sm" checked={isActive} onCheckedChange={onChange} disabled={isPending} />;
}
