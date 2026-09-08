"use client";

import * as React from "react";
import { Loader2, Monitor, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/auth-client";

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | Date;
};

export function SessionsList({ currentToken }: { currentToken: string }) {
  const [sessions, setSessions] = React.useState<SessionRow[] | null>(null);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const { data } = await authClient.listSessions();
    setSessions((data as SessionRow[]) ?? []);
  }, []);

  React.useEffect(() => {
    // Client-only fetch (authClient has no server-side equivalent here) —
    // setState happens after the awaited request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function revoke(token: string) {
    setRevoking(token);
    const { error } = await authClient.revokeSession({ token });
    setRevoking(null);
    if (error) {
      toast.error(error.message ?? "Couldn't revoke that session");
      return;
    }
    toast.success("Session revoked");
    load();
  }

  if (!sessions) {
    return <p className="text-sm text-muted-foreground">Loading sessions…</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Monitor className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {s.userAgent ? s.userAgent.slice(0, 60) : "Unknown device"}
                {s.token === currentToken && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    This device
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.ipAddress ?? "Unknown IP"} · since {new Date(s.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
          {s.token !== currentToken && (
            <Button
              variant="outline"
              size="sm"
              disabled={revoking === s.token}
              onClick={() => revoke(s.token)}
            >
              {revoking === s.token ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldX className="size-3.5" />}
              Revoke
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
