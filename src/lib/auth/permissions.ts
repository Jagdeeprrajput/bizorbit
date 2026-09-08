export type Role = "SUPER_ADMIN" | "CEO" | "CTO" | "HR" | "MANAGER" | "EMPLOYEE";

export type Scope = "SELF" | "TEAM" | "DEPARTMENT" | "COMPANY" | "NONE";

export type Permission =
  | "employee.create"
  | "employee.read"
  | "employee.update"
  | "employee.offboard"
  | "department.manage"
  | "office.manage"
  | "attendance.read"
  | "attendance.regularise"
  | "leave.apply"
  | "leave.approve"
  | "leave.policy.manage"
  | "project.manage"
  | "task.create"
  | "task.assign"
  | "audit.read"
  | "settings.manage"
  | "product.manage"
  | "sales.target.manage"
  | "sales.record"
  | "sales.approve"
  | "sales.read";

// §5.2 — holding a permission is only half the check; every query using this
// also applies the matching scope as a database WHERE clause (§5.2, §5.3).
const matrix: Record<Role, Partial<Record<Permission, Scope>>> = {
  SUPER_ADMIN: {
    "employee.create": "COMPANY",
    "employee.read": "COMPANY",
    "employee.update": "COMPANY",
    "employee.offboard": "COMPANY",
    "department.manage": "COMPANY",
    "office.manage": "COMPANY",
    "attendance.read": "COMPANY",
    "attendance.regularise": "COMPANY",
    "leave.apply": "SELF",
    "leave.approve": "COMPANY",
    "leave.policy.manage": "COMPANY",
    "project.manage": "COMPANY",
    "task.create": "COMPANY",
    "task.assign": "COMPANY",
    "audit.read": "COMPANY",
    "settings.manage": "COMPANY",
    "product.manage": "COMPANY",
    "sales.target.manage": "COMPANY",
    "sales.record": "SELF",
    "sales.approve": "COMPANY",
    "sales.read": "COMPANY",
  },
  CEO: {
    "employee.read": "COMPANY",
    "employee.offboard": "COMPANY",
    "department.manage": "COMPANY",
    "attendance.read": "COMPANY",
    "leave.apply": "SELF",
    "leave.approve": "COMPANY",
    "leave.policy.manage": "COMPANY",
    "project.manage": "COMPANY",
    "task.create": "COMPANY",
    "task.assign": "COMPANY",
    "audit.read": "COMPANY",
    "product.manage": "COMPANY",
    "sales.target.manage": "COMPANY",
    "sales.record": "SELF",
    "sales.approve": "COMPANY",
    "sales.read": "COMPANY",
  },
  CTO: {
    "employee.read": "COMPANY",
    "attendance.read": "COMPANY",
    "leave.apply": "SELF",
    "leave.approve": "COMPANY",
    "project.manage": "COMPANY",
    "task.create": "COMPANY",
    "task.assign": "COMPANY",
    "sales.record": "SELF",
    "sales.read": "COMPANY",
  },
  HR: {
    "employee.create": "COMPANY",
    "employee.read": "COMPANY",
    "employee.update": "COMPANY",
    "employee.offboard": "COMPANY",
    "department.manage": "COMPANY",
    "office.manage": "COMPANY",
    "attendance.read": "COMPANY",
    "attendance.regularise": "COMPANY",
    "leave.apply": "SELF",
    "leave.approve": "COMPANY",
    "leave.policy.manage": "COMPANY",
    "project.manage": "COMPANY",
    "task.create": "COMPANY",
    "task.assign": "COMPANY",
    "product.manage": "COMPANY",
    "sales.target.manage": "COMPANY",
    "sales.record": "SELF",
    "sales.approve": "COMPANY",
    "sales.read": "COMPANY",
  },
  MANAGER: {
    "employee.read": "TEAM",
    "attendance.read": "TEAM",
    "attendance.regularise": "TEAM",
    "leave.apply": "SELF",
    "leave.approve": "TEAM",
    "project.manage": "TEAM",
    "task.create": "TEAM",
    "task.assign": "TEAM",
    "sales.target.manage": "TEAM",
    "sales.record": "SELF",
    "sales.approve": "TEAM",
    "sales.read": "TEAM",
  },
  EMPLOYEE: {
    "employee.read": "SELF",
    "attendance.read": "SELF",
    "leave.apply": "SELF",
    "task.create": "SELF",
    "sales.record": "SELF",
    "sales.read": "SELF",
  },
};

export function getScope(role: Role, permission: Permission): Scope {
  return matrix[role]?.[permission] ?? "NONE";
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getScope(role, permission) !== "NONE";
}
