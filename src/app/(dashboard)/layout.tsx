import { requireAuth } from "@/lib/auth/guards";
import { getUnreadNotificationCount } from "@/server/queries/notification.queries";
import { db } from "@/server/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role ?? "EMPLOYEE";
  const companyId = (session.user as { companyId?: string }).companyId;
  const [unreadCount, company] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    companyId ? db.company.findUnique({ where: { id: companyId }, select: { logoUrl: true } }) : null,
  ]);

  return (
    <div className="flex min-h-svh">
      <Sidebar name={session.user.name} email={session.user.email} role={role} logoUrl={company?.logoUrl} />
      <div className="flex flex-1 flex-col">
        <Topbar name={session.user.name} email={session.user.email} role={role} unreadCount={unreadCount} />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
