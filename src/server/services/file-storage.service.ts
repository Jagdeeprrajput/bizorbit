import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export class FileValidationError extends Error {}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

/** fileKey is company/task scoped and never trusts client input beyond the id + name. */
export async function saveUploadedFile(params: {
  companyId: string;
  scope: "tasks";
  scopeId: string;
  file: File;
}): Promise<{ fileKey: string; fileName: string; mimeType: string; sizeBytes: number }> {
  const { companyId, scope, scopeId, file } = params;

  if (file.size === 0) {
    throw new FileValidationError("File is empty.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError("File exceeds the 10MB limit.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new FileValidationError("File type not allowed.");
  }

  const safeName = sanitizeFileName(file.name || "upload");
  const fileKey = path.posix.join(companyId, scope, scopeId, `${randomUUID()}-${safeName}`);
  const absolutePath = path.join(STORAGE_ROOT, fileKey);

  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new FileValidationError("Invalid file path.");
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return { fileKey, fileName: file.name || safeName, mimeType: file.type, sizeBytes: file.size };
}

export function resolveStoragePath(fileKey: string): string {
  const absolutePath = path.join(STORAGE_ROOT, fileKey);
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new FileValidationError("Invalid file path.");
  }
  return absolutePath;
}

export async function deleteUploadedFile(fileKey: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(fileKey));
  } catch {
    // Already gone — nothing to clean up.
  }
}
