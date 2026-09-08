"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav } from "./sidebar-nav";
import { CommandPalette } from "./command-palette";
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

export function Topbar({
  name,
  email,
  role,
  unreadCount,
}: {
  name: string;
  email: string;
  role: string;
  unreadCount: number;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-16 items-center border-b border-border px-6">
              <span className="text-lg font-semibold tracking-tight">
                Biz<span className="text-brand-text">Orbit</span>
              </span>
            </div>
            <div className="flex flex-col gap-6 px-3 py-6">
              <SidebarNav items={mainNav} role={role} layoutGroup="mobile-sidebar" />
              <SidebarNav items={adminNav} role={role} layoutGroup="mobile-sidebar" />
            </div>
          </SheetContent>
        </Sheet>

        <div className="max-w-sm flex-1">
          <CommandPalette role={role} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ModeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" asChild>
          <Link href="/notifications">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-accent text-xs font-semibold text-brand-text">
                  {initials(name)}
                </AvatarFallback>
                {unreadCount > 0 && <AvatarBadge className="bg-destructive" />}
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <SettingsIcon className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
