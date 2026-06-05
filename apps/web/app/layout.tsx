import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import ConditionalNav from "./components/conditional-nav";
import { BetaBanner } from "./components/beta-banner";
import ConditionalFooter from "./components/conditional-footer";
import { CookieBanner } from "./components/cookie-banner";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GoPass - Marketplace de Bilhética",
  description: "Compre bilhetes digitais seguros para os melhores eventos em Portugal",
  metadataBase: new URL("https://tickets.daowave.pt"),
  applicationName: "GoPass",
};

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: "#0B0C0F" },
      { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    ] as const,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--background))] text-foreground antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Toaster position="top-center" richColors />
            <BetaBanner />
            <ConditionalNav />
            <main className="flex-1 min-w-0 w-full overflow-x-auto">{children}</main>
            <ConditionalFooter />
            <CookieBanner />
          </div>
        </Providers>
      </body>
    </html>
  );
}
