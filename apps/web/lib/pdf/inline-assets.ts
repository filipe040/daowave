import fs from "fs/promises";
import path from "path";

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "");
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "svg") return "image/svg+xml";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  return "image/png";
}

function bufferToDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Converte URL de imagem (local ou remota) para data URI — fiável em PDF headless. */
export async function urlToDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return trimmed;

  const base =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://tickets.daowave.pt";

  let pathname = trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const baseHost = new URL(base.replace(/\/$/, "") || "https://tickets.daowave.pt");
      if (parsed.host === baseHost.host) {
        pathname = parsed.pathname;
      } else {
        return fetchRemoteDataUri(trimmed);
      }
    } catch {
      return fetchRemoteDataUri(trimmed);
    }
  }

  if (pathname.startsWith("/")) {
    const localCandidates = [
      path.join(process.cwd(), "public", pathname),
      path.join(process.cwd(), pathname.slice(1)),
    ];

    for (const filePath of localCandidates) {
      try {
        const buf = await fs.readFile(filePath);
        return bufferToDataUri(buf, mimeFromExt(path.extname(filePath)));
      } catch {
        /* try next */
      }
    }

    return fetchRemoteDataUri(`${base.replace(/\/$/, "")}${pathname}`);
  }

  return fetchRemoteDataUri(trimmed);
}

async function fetchRemoteDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
    const mime =
      contentType && contentType.startsWith("image/")
        ? contentType
        : mimeFromExt(path.extname(new URL(url).pathname));
    return bufferToDataUri(buf, mime);
  } catch {
    return null;
  }
}
