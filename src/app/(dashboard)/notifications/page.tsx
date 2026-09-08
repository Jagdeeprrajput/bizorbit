import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { db } from "@/server/db";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  const notifications = await db.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <NotificationList notifications={notifications} />;
}
