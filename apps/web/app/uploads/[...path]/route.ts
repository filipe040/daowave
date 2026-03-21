import { NextResponse } from "next/server";
import { join, extname } from "path";
import { readFile, stat } from "fs/promises";

export const dynamic = "force-dynamic";

const getMimeType = (filename: string) => {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    
    // The uploaded files are saved in `public/uploads/...`
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadsDir, ...pathArray);

    // Basic security check to prevent directory traversal
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      await stat(filePath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const mimeType = getMimeType(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[uploads] Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
