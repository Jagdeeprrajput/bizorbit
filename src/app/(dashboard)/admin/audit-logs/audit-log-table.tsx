"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const severityVariant: Record<string, "brand" | "warning" | "critical"> = {
  INFO: "brand",
  WARNING: "warning",
  CRITICAL: "critical",
};

type LogRow = {
  id: string;
  createdAt: Date;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  severity: string;
};

export function AuditLogTable({ logs }: { logs: LogRow[] }) {
  const [query, setQuery] = React.useState("");
  const [severity, setSeverity] = React.useState("ALL");
  const [entityType, setEntityType] = React.useState("ALL");

  const entityTypes = React.useMemo(
    () => [...new Set(logs.map((l) => l.entityType))].sort(),
    [logs],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (severity !== "ALL" && log.severity !== severity) return false;
      if (entityType !== "ALL" && log.entityType !== entityType) return false;
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        (log.actorEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, query, severity, entityType]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search action, actor, entity…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severities</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All entities</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {logs.length === 0 ? "Nothing logged yet." : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm">{log.actorEmail ?? "System"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.entityType}/{log.entityId.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[log.severity]}>{log.severity}</Badge>
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
