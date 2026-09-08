"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreference } from "@/server/actions/notification.actions";
import type { notificationCategories } from "@/server/queries/notification.queries";

type Preference = {
  category: (typeof notificationCategories)[number];
  label: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  locked: boolean;
};

export function NotificationPreferences({ preferences }: { preferences: Preference[] }) {
  const [state, setState] = React.useState(preferences);

  function toggle(category: Preference["category"], channel: "inAppEnabled" | "emailEnabled", value: boolean) {
    setState((prev) => prev.map((p) => (p.category === category ? { ...p, [channel]: value } : p)));
    React.startTransition(async () => {
      const result = await updateNotificationPreference(category, channel, value);
      if (!result.success) {
        toast.error(result.error);
        setState((prev) => prev.map((p) => (p.category === category ? { ...p, [channel]: !value } : p)));
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-1 pb-2 text-xs text-muted-foreground">
        <span>Category</span>
        <span className="w-14 text-center">In-app</span>
        <span className="w-14 text-center">Email</span>
      </div>
      {state.map((pref) => (
        <div
          key={pref.category}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md px-1 py-2 odd:bg-secondary/40"
        >
          <span className="text-sm">
            {pref.label}
            {pref.locked && <span className="ml-2 text-xs text-muted-foreground">(always on)</span>}
          </span>
          <div className="flex w-14 justify-center">
            <Switch
              checked={pref.inAppEnabled}
              disabled={pref.locked}
              onCheckedChange={(v) => toggle(pref.category, "inAppEnabled", v)}
            />
          </div>
          <div className="flex w-14 justify-center">
            <Switch
              checked={pref.emailEnabled}
              disabled={pref.locked}
              onCheckedChange={(v) => toggle(pref.category, "emailEnabled", v)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
