import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { db } from "@/server/db";
import { getSession } from "@/lib/auth/guards";
import { resolveStoragePath } from "@/server/services/file-storage.service";

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attachmentId } = await params;
  const attachment = await db.taskAttachment.findFirst({
    where: { id: attachmentId, companyId: session.user.companyId },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(resolveStoragePath(attachment.fileKey));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        "Content-Length": String(attachment.sizeBytes),
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }
}
