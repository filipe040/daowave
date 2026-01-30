import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await context.params;
    if (!userId || !filename) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    // Segurança: só caracteres seguros no path
    if (/[^a-zA-Z0-9._-]/.test(userId) || /[^a-zA-Z0-9._-]/.test(filename)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const contentType = MIME[ext.toLowerCase()] ?? "application/octet-stream";

    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "avatars",
      userId,
      filename
    );

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("[avatar-serve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
