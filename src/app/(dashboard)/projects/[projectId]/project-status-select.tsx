"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProjectStatus } from "@/server/actions/project.actions";
import { projectStatuses } from "@/lib/validations/project";

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: string }) {
  const router = useRouter();

  function onChange(value: string) {
    const next = value as (typeof projectStatuses)[number];
    if (next === status) return;
    (async () => {
      const result = await updateProjectStatus(projectId, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    })();
  }

  return (
    <Select value={status} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {projectStatuses.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
