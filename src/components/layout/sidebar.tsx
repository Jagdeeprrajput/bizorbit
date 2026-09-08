"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Orbit, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "./sidebar-nav";
import { mainNav, adminNav } from "./nav-config";
import { authClient } from "@/lib/auth/auth-client";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({
  name,
  email,
  role,
  logoUrl,
}: {
  name: string;
  email: string;
  role: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-gradient-to-b from-secondary/40 via-background to-background lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Company logo" className="size-8 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] shadow-[var(--shadow-glow)]">
            <Orbit className="size-4 text-white" />
          </div>
        )}
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Biz<span className="text-brand-text">Orbit</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Workspace
          </p>
          <SidebarNav items={mainNav} role={role} />
        </div>
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Admin
          </p>
          <SidebarNav items={adminNav} role={role} />
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="group flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-secondary/60">
          <Avatar className="size-9 ring-2 ring-[var(--brand-200)]">
            <AvatarFallback className="bg-accent text-sm font-semibold text-brand-text">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
