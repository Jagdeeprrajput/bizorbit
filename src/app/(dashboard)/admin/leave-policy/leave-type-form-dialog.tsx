"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLeaveTypeSchema, leaveAccrualMethods, type CreateLeaveTypeInput } from "@/lib/validations/leave";
import { createLeaveType, updateLeaveType } from "@/server/actions/leave.actions";

type ExistingLeaveType = {
  id: string;
  name: string;
  code: string;
  colorHex: string;
  isPaid: boolean;
  annualQuotaDays: { toString(): string };
  accrualMethod: (typeof leaveAccrualMethods)[number];
  allowCarryForward: boolean;
  maxCarryForwardDays: { toString(): string } | null;
  requiresDocumentAfterDays: number | null;
  minNoticeDays: number;
  maxConsecutiveDays: number | null;
  allowHalfDay: boolean;
  deductsFromBalance: boolean;
};

export function LeaveTypeFormDialog({ leaveType }: { leaveType?: ExistingLeaveType }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const isEdit = Boolean(leaveType);

  const form = useForm<z.input<typeof createLeaveTypeSchema>, unknown, CreateLeaveTypeInput>({
    resolver: zodResolver(createLeaveTypeSchema),
    defaultValues: {
      name: leaveType?.name ?? "",
      code: leaveType?.code ?? "",
      colorHex: leaveType?.colorHex ?? "#ed7014",
      isPaid: leaveType?.isPaid ?? true,
      annualQuotaDays: leaveType ? Number(leaveType.annualQuotaDays.toString()) : 0,
      accrualMethod: leaveType?.accrualMethod ?? "ANNUAL_UPFRONT",
      allowCarryForward: leaveType?.allowCarryForward ?? false,
      maxCarryForwardDays: leaveType?.maxCarryForwardDays ? Number(leaveType.maxCarryForwardDays.toString()) : 0,
      requiresDocumentAfterDays: leaveType?.requiresDocumentAfterDays ?? 0,
      minNoticeDays: leaveType?.minNoticeDays ?? 0,
      maxConsecutiveDays: leaveType?.maxConsecutiveDays ?? 0,
      allowHalfDay: leaveType?.allowHalfDay ?? true,
      deductsFromBalance: leaveType?.deductsFromBalance ?? true,
    },
  });

  const allowCarryForward = form.watch("allowCarryForward");

  function onSubmit(values: CreateLeaveTypeInput) {
    startTransition(async () => {
      const result = isEdit ? await updateLeaveType(leaveType!.id, values) : await createLeaveType(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Leave type updated" : "Leave type created");
      if (!isEdit) form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="size-7">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            New leave type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit leave type" : "New leave type"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Leave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="colorHex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input type="color" className="h-9 w-14 p-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="ANNUAL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annualQuotaDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual quota (days)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accrualMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accrual</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveAccrualMethods.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minNoticeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min notice (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxConsecutiveDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max consecutive (0 = none)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiresDocumentAfterDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Require document after (days, 0 = never)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowCarryForward"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="font-normal">Allow carry-forward to next year</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {allowCarryForward && (
              <FormField
                control={form.control}
                name="maxCarryForwardDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max carry-forward (days, 0 = unlimited)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                    <FormLabel className="font-normal">Paid leave</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowHalfDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                    <FormLabel className="font-normal">Allow half-day</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deductsFromBalance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="font-normal">Deducts from balance</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create leave type"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
