"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "cn";
import { filterNavByRole, type NavItem } from "./nav-config";

export function SidebarNav({
  items,
  role,
  layoutGroup = "sidebar",
}: {
  items: NavItem[];
  role: string;
  /** Distinguishes the desktop sidebar from the mobile sheet's copy — both are
   * mounted simultaneously (the desktop one just CSS-hidden below `lg`), and
   * sharing one layoutId across them would make Motion animate the pill
   * between two different DOM trees. */
  layoutGroup?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {filterNavByRole(items, role).map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutGroup}-active-pill`}
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className="relative z-10 size-4 shrink-0" />
            <span className="relative z-10">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
