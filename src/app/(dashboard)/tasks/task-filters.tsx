"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskBoard, type TaskCard } from "./task-board";

const priorities = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function TaskFilters({ tasks, currentUserId }: { tasks: TaskCard[]; currentUserId: string }) {
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState<(typeof priorities)[number]>("ALL");
  const [mineOnly, setMineOnly] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q && !task.title.toLowerCase().includes(q)) return false;
      if (priority !== "ALL" && task.priority !== priority) return false;
      if (mineOnly && !task.assignments.some((a) => a.assignee.id === currentUserId)) return false;
      return true;
    });
  }, [tasks, search, priority, mineOnly, currentUserId]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "ALL" ? "All priorities" : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={mineOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setMineOnly((v) => !v)}
        >
          My tasks
        </Button>
        {(search || priority !== "ALL" || mineOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setPriority("ALL");
              setMineOnly(false);
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {tasks.length}
        </span>
      </div>
      <TaskBoard tasks={filtered} />
    </div>
  );
}
