"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAttendancePolicySchema,
  weekdayOptions,
  type CreateAttendancePolicyInput,
} from "@/lib/validations/attendance-policy";
import { createAttendancePolicy } from "@/server/actions/attendance-policy.actions";

const dayLabel: Record<(typeof weekdayOptions)[number], string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

export function PolicyFormDialog({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.input<typeof createAttendancePolicySchema>, unknown, CreateAttendancePolicyInput>({
    resolver: zodResolver(createAttendancePolicySchema),
    defaultValues: {
      name: "",
      isDefault: false,
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      graceMinutes: 15,
      minFullDayMinutes: 480,
      minHalfDayMinutes: 240,
      maxBreakMinutesPerDay: 60,
      workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      requireGeofence: true,
      allowRemoteClockIn: false,
    },
  });

  function onSubmit(values: CreateAttendancePolicyInput) {
    startTransition(async () => {
      const result = await createAttendancePolicy(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Policy created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New attendance policy</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Standard shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shiftStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shiftEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift end</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="graceMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxBreakMinutesPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max break (min/day)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minFullDayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full day ≥ (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minHalfDayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Half day ≥ (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="workingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working days</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {weekdayOptions.map((day) => {
                      const checked = field.value?.includes(day);
                      return (
                        <label key={day} className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const current = field.value ?? [];
                              field.onChange(v ? [...current, day] : current.filter((d) => d !== day));
                            }}
                          />
                          {dayLabel[day]}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireGeofence"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border border-border px-3 py-2 space-y-0">
                  <FormLabel className="font-normal">Require geofence to clock in</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowRemoteClockIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border border-border px-3 py-2 space-y-0">
                  <FormLabel className="font-normal">Allow remote clock-in (outside geofence)</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {departments.length > 0 && (
              <FormField
                control={form.control}
                name="appliesToDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies to (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Company default" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} only
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border border-border px-3 py-2 space-y-0">
                  <FormLabel className="font-normal">Make this the company default</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Create policy
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
