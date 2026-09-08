"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addProjectMember, removeProjectMember } from "@/server/actions/project.actions";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

type Member = { userId: string; role: string; user: { id: string; name: string; employeeCode: string } };

export function ProjectMembers({
  projectId,
  members,
  candidates,
  canManage,
}: {
  projectId: string;
  members: Member[];
  candidates: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [addValue, setAddValue] = React.useState("");

  const memberIds = new Set(members.map((m) => m.userId));
  const available = candidates.filter((c) => !memberIds.has(c.id));

  function add(userId: string) {
    startTransition(async () => {
      const result = await addProjectMember(projectId, userId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAddValue("");
      router.refresh();
    });
  }

  function remove(userId: string) {
    startTransition(async () => {
      await removeProjectMember(projectId, userId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.userId} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials(member.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{member.user.name}</p>
              <p className="text-xs text-muted-foreground">{member.user.employeeCode}</p>
            </div>
            {member.role === "LEAD" && <Badge className="ml-1 text-[10px]">Lead</Badge>}
          </div>
          {canManage && member.role !== "LEAD" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={isPending}
              onClick={() => remove(member.userId)}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ))}

      {canManage && available.length > 0 && (
        <div className="flex gap-2 pt-2">
          <Select value={addValue} onValueChange={(v) => { setAddValue(v); add(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a member…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && <Loader2 className="mt-2 size-4 shrink-0 animate-spin" />}
          {!isPending && <UserPlus className="mt-2 size-4 shrink-0 text-muted-foreground" />}
        </div>
      )}
    </div>
  );
}
