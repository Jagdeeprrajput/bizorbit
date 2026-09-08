"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { approveRegularisation } from "@/server/actions/attendance.actions";

type PendingRecord = {
  id: string;
  workDate: Date;
  regularisationNote: string | null;
  user: { name: string; employeeCode: string };
};

export function PendingRegularisations({ records }: { records: PendingRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function decide(id: string, approve: boolean) {
    setPendingId(id);
    React.startTransition(async () => {
      const result = await approveRegularisation(id, approve);
      setPendingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(approve ? "Approved" : "Rejected");
      router.refresh();
    });
  }

  if (records.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">Pending regularisations</CardTitle>
        <CardDescription>Corrections your reports have requested.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {record.user.name} <span className="text-muted-foreground">· {record.user.employeeCode}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(record.workDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} —{" "}
                {record.regularisationNote}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pendingId === record.id}
                onClick={() => decide(record.id, false)}
              >
                {pendingId === record.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              </Button>
              <Button size="sm" disabled={pendingId === record.id} onClick={() => decide(record.id, true)}>
                {pendingId === record.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
