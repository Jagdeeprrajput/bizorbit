"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { notificationCategories } from "@/server/queries/notification.queries";

type NotificationCategory = (typeof notificationCategories)[number];

export async function markNotificationRead(notificationId: string) {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  await db.notification.updateMany({
    where: { id: notificationId, userId: actor.id },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  await db.notification.updateMany({
    where: { userId: actor.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  channel: "inAppEnabled" | "emailEnabled",
  value: boolean,
) {
  const session = await requireAuth();
  const actor = session.user as AppUser;

  if (category === "SECURITY") {
    return { success: false, error: "Security notifications can't be disabled." };
  }

  await db.notificationPreference.upsert({
    where: { userId_category: { userId: actor.id, category } },
    update: { [channel]: value },
    create: {
      companyId: actor.companyId,
      userId: actor.id,
      category,
      inAppEnabled: channel === "inAppEnabled" ? value : true,
      emailEnabled: channel === "emailEnabled" ? value : true,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
