"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postProjectUpdateSchema, type PostProjectUpdateInput } from "@/lib/validations/project";
import { postProjectUpdate } from "@/server/actions/project.actions";
import { projectStatuses } from "@/lib/validations/project";

const statusVariant: Record<string, "outline" | "success" | "warning" | "brand" | "critical"> = {
  PLANNING: "outline",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "brand",
  CANCELLED: "critical",
};

type Update = {
  id: string;
  status: string;
  body: string;
  createdAt: Date;
  author: { name: string };
};

export function ProjectUpdates({
  projectId,
  currentStatus,
  updates,
}: {
  projectId: string;
  currentStatus: string;
  updates: Update[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PostProjectUpdateInput>({
    resolver: zodResolver(postProjectUpdateSchema),
    defaultValues: { projectId, status: currentStatus as PostProjectUpdateInput["status"], body: "" },
  });

  function onSubmit(values: PostProjectUpdateInput) {
    startTransition(async () => {
      const result = await postProjectUpdate(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      form.reset({ projectId, status: values.status, body: "" });
      router.refresh();
    });
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-40">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea rows={1} placeholder="Post a status update…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6 space-y-3">
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates posted yet.</p>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium">{update.author.name}</p>
                <Badge variant={statusVariant[update.status]} className="text-[10px]">
                  {update.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(update.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{update.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
