import { notFound } from "next/navigation";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getTaskById, listAssignableUsers } from "@/server/queries/task.queries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "./comment-form";
import { AttachmentsPanel } from "./attachments-panel";
import { EditTaskDialog, DeleteTaskButton } from "./edit-task-dialog";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const task = await getTaskById(taskId, actor.companyId);

  if (!task) {
    notFound();
  }

  const canEdit = task.createdById === actor.id || hasPermission(actor.role, "task.assign");
  const users = canEdit ? await listAssignableUsers(actor.companyId) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created by {task.createdBy.name}
            {task.assignments.length > 0 && (
              <> · assigned to {task.assignments.map((a) => a.assignee.name).join(", ")}</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex gap-2">
            <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
            <Badge>{task.priority}</Badge>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <EditTaskDialog
                taskId={task.id}
                users={users}
                defaultValues={{
                  title: task.title,
                  description: task.description ?? "",
                  priority: task.priority,
                  assigneeIds: task.assignments.map((a) => a.assignee.id),
                  dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
                }}
              />
              <DeleteTaskButton taskId={task.id} />
            </div>
          )}
        </div>
      </div>

      {task.description && <p className="mt-6 text-sm text-muted-foreground">{task.description}</p>}

      <Separator className="my-8" />

      <h2 className="mb-4 text-sm font-semibold">Comments</h2>
      <div className="space-y-4">
        {task.comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border border-border px-4 py-3">
            <p className="text-xs font-medium">{comment.author.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
          </div>
        ))}
        {task.comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>
      <div className="mt-4">
        <CommentForm taskId={task.id} />
      </div>

      <Separator className="my-8" />

      <AttachmentsPanel taskId={task.id} attachments={task.attachments} />

      <Separator className="my-8" />

      <h2 className="mb-4 text-sm font-semibold">Activity</h2>
      <div className="space-y-3">
        {task.activities.map((activity) => (
          <p key={activity.id} className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{activity.actor.name}</span>{" "}
            {activity.type === "CREATED" && "created this task"}
            {activity.type === "STATUS_CHANGED" && `moved this from ${activity.fromValue} to ${activity.toValue}`}
            {activity.type === "PRIORITY_CHANGED" && `changed priority from ${activity.fromValue} to ${activity.toValue}`}
            {activity.type === "DUE_DATE_CHANGED" &&
              `changed the due date${activity.fromValue ? ` from ${activity.fromValue}` : ""} to ${activity.toValue ?? "none"}`}
            {activity.type === "ASSIGNED" && "assigned this task"}
            {activity.type === "UNASSIGNED" && "removed an assignee"}
            {activity.type === "COMMENTED" && "commented"}
            {activity.type === "ATTACHMENT_ADDED" && `attached ${activity.toValue}`}
            {" · "}
            {new Date(activity.createdAt).toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    </div>
  );
}
