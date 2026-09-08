"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/notification.actions";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

type Notification = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  category: string;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markAll() {
    React.startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function markOne(id: string) {
    React.startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <Check className="size-4" />
            Mark all read
          </Button>
        )}
      </div>

      <RevealGroup className="mt-8 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Bell className="size-8" />
            <p>You&apos;re all caught up.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const content = (
              <div
                className={`flex items-start justify-between rounded-lg border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                  n.isRead ? "border-border hover:bg-secondary/50" : "border-brand-text/40 bg-accent/40 hover:bg-accent/60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead && <Badge className="h-4 px-1.5 text-[10px]">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      markOne(n.id);
                    }}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            );
            return (
              <RevealItem key={n.id}>
                {n.linkUrl ? (
                  <Link href={n.linkUrl} onClick={() => markOne(n.id)}>
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </RevealItem>
            );
          })
        )}
      </RevealGroup>
    </div>
  );
}
