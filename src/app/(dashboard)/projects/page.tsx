import Link from "next/link";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listProjects } from "@/server/queries/project.queries";
import { listAssignableUsers } from "@/server/queries/task.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "./project-form-dialog";

const statusVariant: Record<string, "outline" | "success" | "warning" | "brand" | "critical"> = {
  PLANNING: "outline",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "brand",
  CANCELLED: "critical",
};

export default async function ProjectsPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const canManage = hasPermission(actor.role, "project.manage");

  const [projects, users] = await Promise.all([
    listProjects(actor),
    canManage ? listAssignableUsers(actor.companyId) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        {canManage && <ProjectFormDialog users={users} />}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <p className="col-span-full py-16 text-center text-muted-foreground">
            {canManage ? "No projects yet — create your first one above." : "You're not on any projects yet."}
          </p>
        ) : (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-lg)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {project.code}
                    </Badge>
                    <Badge variant={statusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>
                  </div>
                  <CardTitle className="mt-2">{project.name}</CardTitle>
                  <CardDescription>{project.description || "No description"}</CardDescription>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Led by {project.owner.name} · {project._count.members} member(s) · {project._count.tasks} task(s)
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
