"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { mainNav, adminNav, quickActionNav, filterNavByRole } from "./nav-config";

export function CommandPalette({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-full items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-secondary sm:flex"
      >
        <Search className="size-3.5" />
        Search pages, actions…
        <kbd className="ml-auto rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Jump to…" description="Search pages and actions">
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {filterNavByRole(quickActionNav, role).map(({ label, href, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => go(href)}>
                <Icon />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            {filterNavByRole(mainNav, role).map(({ label, href, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => go(href)}>
                <Icon />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Admin">
            {filterNavByRole(adminNav, role).map(({ label, href, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => go(href)}>
                <Icon />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="flex items-center justify-end border-t border-border px-3 py-2">
          <CommandShortcut>Esc to close</CommandShortcut>
        </div>
      </CommandDialog>
    </>
  );
}
