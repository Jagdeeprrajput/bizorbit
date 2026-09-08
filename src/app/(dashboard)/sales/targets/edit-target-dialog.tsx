"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Ban } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSalesTargetSchema, type UpdateSalesTargetInput } from "@/lib/validations/sales";
import { updateSalesTarget, cancelSalesTarget } from "@/server/actions/sales.actions";

type Target = {
  id: string;
  targetValue: number | string;
  startDate: Date | string;
  endDate: Date | string;
  notes: string | null;
};

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function EditTargetDialog({ target }: { target: Target }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const defaultValues = {
    targetValue: Number(target.targetValue),
    startDate: toDateInput(target.startDate),
    endDate: toDateInput(target.endDate),
    notes: target.notes ?? "",
  };

  const form = useForm<z.input<typeof updateSalesTargetSchema>, unknown, UpdateSalesTargetInput>({
    resolver: zodResolver(updateSalesTargetSchema),
    defaultValues,
  });

  function onSubmit(values: UpdateSalesTargetInput) {
    startTransition(async () => {
      const result = await updateSalesTarget(target.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Target updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(defaultValues);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit target</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target value</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CancelTargetButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function confirmCancel() {
    startTransition(async () => {
      const result = await cancelSalesTarget(targetId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Target cancelled");
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
          <Ban className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this target?</DialogTitle>
          <DialogDescription>
            It stops counting toward progress and disappears from active lists. Sales already logged against it
            are kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep target</Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={confirmCancel}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Cancel target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
