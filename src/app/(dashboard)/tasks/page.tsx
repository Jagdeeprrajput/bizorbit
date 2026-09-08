import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { listTasks, listAssignableUsers } from "@/server/queries/task.queries";
import { listProjects } from "@/server/queries/project.queries";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskFilters } from "./task-filters";

export default async function TasksPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const [tasks, users, projects] = await Promise.all([
    listTasks(actor),
    listAssignableUsers(actor.companyId),
    listProjects(actor),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <TaskFormDialog users={users} projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
      <TaskFilters tasks={tasks} currentUserId={actor.id} />
    </div>
  );
}
