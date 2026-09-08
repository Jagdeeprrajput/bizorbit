"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Paperclip, Download, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addTaskAttachment, deleteTaskAttachment } from "@/server/actions/task.actions";

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: { id: string; name: string };
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds the 10MB limit.");
      e.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await addTaskAttachment(taskId, formData);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("File attached.");
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId);
    startTransition(async () => {
      const result = await deleteTaskAttachment(attachmentId);
      if (!result.success) {
        toast.error(result.error);
      }
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>
          {isPending && !deletingId ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Paperclip className="size-3.5" />
          )}
          Attach file
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.sizeBytes)} · {attachment.uploadedBy.name} ·{" "}
                  {new Date(attachment.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <a href={attachment.fileUrl} download>
                <Button variant="ghost" size="icon" className="size-8">
                  <Download className="size-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={deletingId === attachment.id}
                onClick={() => handleDelete(attachment.id)}
              >
                {deletingId === attachment.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        {attachments.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            No files attached yet.
          </p>
        )}
      </div>
    </div>
  );
}
