/**
 * Converte HTML em PDF via Playwright (Chromium headless).
 * Usado para bilhetes e faturas com o mesmo design do preview no dashboard.
 */

import { safeLog } from "@/lib/security";

type Browser = import("playwright").Browser;

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright");

  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    undefined;

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  return browser;
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = launchBrowser()
      .then((browser) => {
        browserInstance = browser;
        return browser;
      })
      .catch((err) => {
        browserLaunchPromise = null;
        throw err;
      });
  }

  return browserLaunchPromise;
}

export type HtmlToPdfOptions = {
  format?: "A4" | "Letter";
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  /** Recorta o PDF às dimensões do elemento (ex.: .ticket-page) */
  fitSelector?: string;
  width?: string;
  height?: string;
};

export async function renderHtmlToPdf(
  html: string,
  options?: HtmlToPdfOptions
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 920, height: 1400 });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 45_000,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const margin = options?.margin ?? {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    };

    if (options?.fitSelector) {
      const box = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return { width: rect.width, height: rect.height };
      }, options.fitSelector);

      if (box) {
        const pdfBuffer = await page.pdf({
          width: `${Math.ceil(box.width)}px`,
          height: `${Math.ceil(box.height)}px`,
          printBackground: true,
          margin,
        });
        return Buffer.from(pdfBuffer);
      }
    }

    const pdfBuffer = await page.pdf({
      ...(options?.width && options?.height
        ? { width: options.width, height: options.height }
        : { format: options?.format ?? "A4" }),
      printBackground: true,
      preferCSSPageSize: !options?.format && !options?.width,
      margin,
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
  if (!isPlaywrightAvailable()) {
    safeLog.warn("HTML to PDF: Playwright não instalado (npm run pdf:setup)");
    return null;
  }

  try {
    return await renderHtmlToPdf(html, options);
  } catch (err) {
    safeLog.warn("HTML to PDF failed (Playwright)", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
