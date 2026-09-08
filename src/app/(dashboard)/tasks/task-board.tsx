"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus } from "@/server/actions/task.actions";
import { taskStatuses } from "@/lib/validations/task";
import { cn } from "cn";

export type TaskCard = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  assignments: { assignee: { id: string; name: string } }[];
};

const columns: { status: (typeof taskStatuses)[number]; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "IN_REVIEW", label: "In review" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
];

const priorityVariant: Record<string, "outline" | "brand" | "warning" | "critical"> = {
  LOW: "outline",
  MEDIUM: "brand",
  HIGH: "warning",
  URGENT: "critical",
};

function isOverdue(task: TaskCard): boolean {
  if (!task.dueDate || task.status === "DONE" || task.status === "CANCELLED") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

function TaskCardContent({ task }: { task: TaskCard }) {
  const overdue = isOverdue(task);
  return (
    <>
      <CardHeader className="px-3">
        <Link href={`/tasks/${task.id}`} onClick={(e) => e.stopPropagation()}>
          <CardTitle className="text-sm font-medium hover:underline">{task.title}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        <div className="flex items-center justify-between">
          <Badge variant={priorityVariant[task.priority]} className="text-[10px]">
            {task.priority}
          </Badge>
          {task.assignments.length > 0 && (
            <span className="truncate text-xs text-muted-foreground">
              {task.assignments.map((a) => a.assignee.name.split(" ")[0]).join(", ")}
            </span>
          )}
        </div>
        {task.dueDate && (
          <p className={cn("text-[11px]", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
            {overdue ? "Overdue · " : "Due "}
            {new Date(task.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </p>
        )}
      </CardContent>
    </>
  );
}

function DraggableTaskCard({ task }: { task: TaskCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <Card
        className={cn(
          "cursor-grab gap-3 py-3 transition-shadow hover:shadow-[var(--shadow-lg)] active:cursor-grabbing",
          isOverdue(task) && "border-destructive/40",
        )}
      >
        <TaskCardContent task={task} />
      </Card>
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  tasks,
}: {
  status: (typeof taskStatuses)[number];
  label: string;
  tasks: TaskCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="w-[240px] shrink-0">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] space-y-2 rounded-lg p-1 transition-colors",
          isOver && "bg-accent/60 ring-2 ring-inset ring-primary/30",
        )}
      >
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && !isOver && (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Empty
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ tasks }: { tasks: TaskCard[] }) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = React.useState(tasks);
  const [prevTasks, setPrevTasks] = React.useState(tasks);
  const [activeTask, setActiveTask] = React.useState<TaskCard | null>(null);

  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setLocalTasks(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = localTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as (typeof taskStatuses)[number];
    const task = localTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousStatus = task.status;
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    React.startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus);
      if (!result.success) {
        toast.error(result.error);
        setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)));
        return;
      }
      router.refresh();
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column.status}
            status={column.status}
            label={column.label}
            tasks={localTasks.filter((t) => t.status === column.status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <Card className="w-[224px] gap-3 py-3 shadow-lg">
            <TaskCardContent task={activeTask} />
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
