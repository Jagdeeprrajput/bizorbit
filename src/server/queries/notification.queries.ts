import "server-only";
import { db } from "@/server/db";

export const notificationCategories = [
  "ATTENDANCE",
  "LEAVE_REQUEST",
  "LEAVE_DECISION",
  "TASK_ASSIGNED",
  "TASK_DUE",
  "TASK_COMMENT",
  "ANNOUNCEMENT",
  "SECURITY",
] as const;

const categoryLabel: Record<(typeof notificationCategories)[number], string> = {
  ATTENDANCE: "Attendance",
  LEAVE_REQUEST: "Leave requests",
  LEAVE_DECISION: "Leave decisions",
  TASK_ASSIGNED: "Task assigned to you",
  TASK_DUE: "Task due soon",
  TASK_COMMENT: "Task comments",
  ANNOUNCEMENT: "Announcements",
  SECURITY: "Security",
};

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } });
}

/** SECURITY can never be disabled (§12.4) — rows default to both channels on. */
export async function getNotificationPreferences(userId: string) {
  const rows = await db.notificationPreference.findMany({ where: { userId } });
  const byCategory = new Map(rows.map((r) => [r.category, r]));

  return notificationCategories.map((category) => {
    const existing = byCategory.get(category);
    return {
      category,
      label: categoryLabel[category],
      inAppEnabled: existing?.inAppEnabled ?? true,
      emailEnabled: existing?.emailEnabled ?? true,
      locked: category === "SECURITY",
    };
  });
}
