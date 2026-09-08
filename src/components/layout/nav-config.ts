import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Fingerprint,
  CalendarCheck,
  FolderKanban,
  KanbanSquare,
  Users,
  FileSpreadsheet,
  Bell,
  Settings,
  Building2,
  MapPin,
  History,
  TrendingUp,
  PartyPopper,
  BadgeCheck,
  Building,
  Clock,
  Package,
  CalendarCog,
} from "lucide-react";

export type Role = "SUPER_ADMIN" | "CEO" | "CTO" | "HR" | "MANAGER" | "EMPLOYEE";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit to show for every role. */
  roles?: Role[];
};

export function filterNavByRole(items: NavItem[], role: string): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role as Role));
}

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Attendance",
    href: "/attendance",
    icon: Fingerprint,
    roles: ["CEO", "CTO", "HR", "MANAGER", "EMPLOYEE"],
  },
  { label: "Leave", href: "/leave", icon: CalendarCheck },
  { label: "Sales", href: "/sales", icon: TrendingUp },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: KanbanSquare },
  { label: "Employees", href: "/employees", icon: Users, roles: ["SUPER_ADMIN", "CEO", "CTO", "HR", "MANAGER"] },
  { label: "Reports", href: "/reports", icon: FileSpreadsheet },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export const adminNav: NavItem[] = [
  { label: "Departments", href: "/admin/departments", icon: Building2, roles: ["SUPER_ADMIN", "CEO", "HR"] },
  { label: "Designations", href: "/admin/designations", icon: BadgeCheck, roles: ["SUPER_ADMIN", "CEO", "HR"] },
  { label: "Offices", href: "/admin/offices", icon: MapPin, roles: ["SUPER_ADMIN", "HR"] },
  { label: "Holidays", href: "/admin/holidays", icon: PartyPopper, roles: ["SUPER_ADMIN", "CEO", "HR"] },
  { label: "Leave policy", href: "/admin/leave-policy", icon: CalendarCog, roles: ["SUPER_ADMIN", "CEO", "HR"] },
  { label: "Audit log", href: "/admin/audit-logs", icon: History, roles: ["SUPER_ADMIN", "CEO"] },
  { label: "Company", href: "/admin/company", icon: Building, roles: ["SUPER_ADMIN"] },
  { label: "Attendance policy", href: "/admin/attendance-policy", icon: Clock, roles: ["SUPER_ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const quickActionNav: NavItem[] = [
  {
    label: "Clock in / out",
    href: "/attendance",
    icon: Fingerprint,
    roles: ["CEO", "CTO", "HR", "MANAGER", "EMPLOYEE"],
  },
  { label: "Apply for leave", href: "/leave/apply", icon: CalendarCheck },
  { label: "Log a sale", href: "/sales/entries", icon: TrendingUp },
  {
    label: "Invite employee",
    href: "/employees/new",
    icon: Users,
    roles: ["SUPER_ADMIN", "CEO", "HR"],
  },
  {
    label: "New task",
    href: "/tasks",
    icon: KanbanSquare,
  },
  {
    label: "New product",
    href: "/sales/products",
    icon: Package,
    roles: ["SUPER_ADMIN", "CEO", "HR"],
  },
];
