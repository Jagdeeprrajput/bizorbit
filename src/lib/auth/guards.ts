import "server-only";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth, type Session } from "@/lib/auth/auth";
import { getScope, hasPermission, type Permission, type Role } from "@/lib/auth/permissions";
import { db } from "@/server/db";

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export type AppUser = Session["user"] & {
  role: Role;
  companyId: string;
  status: string;
  managerId: string | null;
  departmentId: string | null;
};

/** Server Actions and pages call this — fails closed if the permission is missing. */
export async function requirePermission(permission: Permission): Promise<AppUser> {
  const session = await requireAuth();
  const user = session.user as AppUser;
  if (!hasPermission(user.role, permission)) {
    notFound();
  }
  return user;
}

/**
 * Recursively resolves every user id reporting up to `managerId` (direct and
 * skip-level), per §5.2's TEAM scope. Depth-capped so a bad data cycle can't
 * loop forever.
 */
async function getTeamUserIds(managerId: string, depth = 0): Promise<string[]> {
  if (depth > 10) return [];
  const directReports = await db.user.findMany({
    where: { managerId, deletedAt: null },
    select: { id: true },
  });
  const ids = directReports.map((u) => u.id);
  const nested = await Promise.all(ids.map((id) => getTeamUserIds(id, depth + 1)));
  return [...ids, ...nested.flat()];
}

/**
 * Turns a permission's scope into a Prisma `where` filter on `userId` (or
 * `companyId` for COMPANY scope) — applied to the query, never to the UI.
 * This is the enforcement point described in AGENTS.md §5.2/§9.3.
 */
export async function scopeFilter(
  user: AppUser,
  permission: Permission,
): Promise<{ userId?: { in: string[] } | string; companyId?: string } | null> {
  const scope = getScope(user.role, permission);
  switch (scope) {
    case "NONE":
      return null;
    case "SELF":
      return { userId: user.id };
    case "TEAM": {
      const teamIds = await getTeamUserIds(user.id);
      return { userId: { in: [user.id, ...teamIds] } };
    }
    case "DEPARTMENT":
    case "COMPANY":
      return { companyId: user.companyId };
  }
}
