"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<string, "success" | "warning" | "critical" | "outline"> = {
  ACTIVE: "success",
  INVITED: "warning",
  SUSPENDED: "critical",
  OFFBOARDED: "outline",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

type Employee = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  status: string;
  department: { name: string } | null;
  designation: { title: string } | null;
  manager: { name: string } | null;
};

export function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.department?.name.toLowerCase().includes(q),
    );
  }, [employees, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, email, code…"
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {employees.length === 0 ? "No employees yet." : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((employee) => (
                <TableRow key={employee.id} className="transition-colors hover:bg-accent/40">
                  <TableCell>
                    <Link href={`/employees/${employee.id}`} className="group flex items-center gap-3">
                      <Avatar className="size-8 ring-2 ring-transparent transition-all group-hover:ring-primary/30">
                        <AvatarFallback className="bg-accent text-xs text-brand-text">
                          {initials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium group-hover:underline">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.employeeCode}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>{employee.department?.name ?? "—"}</TableCell>
                  <TableCell>{employee.designation?.title ?? "—"}</TableCell>
                  <TableCell>{employee.manager?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[employee.status] ?? "secondary"}>{employee.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
