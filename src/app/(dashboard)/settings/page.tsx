import { requireAuth, type AppUser } from "@/lib/auth/guards";
import { getNotificationPreferences } from "@/server/queries/notification.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { SessionsList } from "./sessions-list";
import { NotificationPreferences } from "./notification-preferences";
import { TwoFactorSettings } from "./two-factor-settings";

export default async function SettingsPage() {
  const session = await requireAuth();
  const actor = session.user as AppUser;
  const preferences = await getNotificationPreferences(actor.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification preferences</CardTitle>
            <CardDescription>
              Choose in-app and email delivery per category. Security notifications can&apos;t be
              turned off.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <NotificationPreferences preferences={preferences} />
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Two-factor authentication</CardTitle>
            <CardDescription>
              Add an extra step at sign-in using an authenticator app.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <TwoFactorSettings initiallyEnabled={Boolean(actor.twoFactorEnabled)} />
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active sessions</CardTitle>
            <CardDescription>
              Every device currently signed in. Sessions are database-backed — revoking one
              here signs it out instantly.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <SessionsList currentToken={session.session.token} />
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
