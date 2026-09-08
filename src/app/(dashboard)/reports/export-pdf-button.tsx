"use client";

import * as React from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPdf } from "@/lib/utils/pdf";

export function ExportPdfButton({
  title,
  subtitle,
  columns,
  rows,
  filename,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={rows.length === 0 || isPending}
      onClick={() =>
        startTransition(() => {
          downloadPdf({ title, subtitle, columns, rows, filename });
        })
      }
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      Export PDF
    </Button>
  );
}
