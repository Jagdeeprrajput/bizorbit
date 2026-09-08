import { notFound } from "next/navigation";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getProjectById } from "@/server/queries/project.queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectStatusSelect } from "./project-status-select";
import { ProjectMembers } from "./project-members";
import { ProjectUpdates } from "./project-updates";
import { EditProjectDialog } from "./edit-project-dialog";
import { TaskFormDialog } from "../../tasks/task-form-dialog";
import { TaskBoard } from "../../tasks/task-board";

const statusVariant: Record<string, "outline" | "success" | "warning" | "brand" | "critical"> = {
  PLANNING: "outline",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "brand",
  CANCELLED: "critical",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canManage = hasPermission(actor.role, "project.manage");

  const project = await getProjectById(projectId, actor.companyId);
  if (!project) {
    notFound();
  }

  const memberOptions = project.members.map((m) => ({ id: m.user.id, name: m.user.name }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {project.code}
            </Badge>
            {!canManage && <Badge variant={statusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Led by {project.owner.name} · created by {project.createdBy.name}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col items-end gap-2">
            <ProjectStatusSelect projectId={project.id} status={project.status} />
            <EditProjectDialog
              projectId={project.id}
              candidates={memberOptions}
              defaultValues={{
                name: project.name,
                description: project.description ?? "",
                ownerId: project.owner.id,
                startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
                endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "",
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectMembers
              projectId={project.id}
              members={project.members}
              candidates={memberOptions}
              canManage={canManage}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Status updates</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectUpdates projectId={project.id} currentStatus={project.status} updates={project.updates} />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <TaskFormDialog users={memberOptions} defaultProjectId={project.id} />
      </div>
      <TaskBoard tasks={project.tasks} />
    </div>
  );
}
