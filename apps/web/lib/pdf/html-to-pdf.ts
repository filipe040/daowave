/**
 * Converte HTML em PDF via Playwright (Chromium headless).
 * Usado para bilhetes e faturas com o mesmo design do preview no dashboard.
 */

import { safeLog } from "@/lib/security";

type Browser = import("playwright").Browser;

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = (async () => {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      browserInstance = browser;
      return browser;
    })();
  }

  return browserLaunchPromise;
}

export type HtmlToPdfOptions = {
  format?: "A4" | "Letter";
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
};

export async function renderHtmlToPdf(
  html: string,
  options?: HtmlToPdfOptions
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdfBuffer = await page.pdf({
      format: options?.format ?? "A4",
      printBackground: true,
      margin: options?.margin ?? {
        top: "10mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function closePdfBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {
      /* ignore */
    }
    browserInstance = null;
    browserLaunchPromise = null;
  }
}

export function isPlaywrightAvailable(): boolean {
  try {
    require.resolve("playwright");
    return true;
  } catch {
    return false;
  }
}

export async function tryRenderHtmlToPdf(
  html: string,
  options?: HtmlToPdfOptions
): Promise<Buffer | null> {
  try {
    return await renderHtmlToPdf(html, options);
  } catch (err) {
    safeLog.warn("HTML to PDF failed (Playwright)", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
