import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import ConditionalNav from "./components/conditional-nav";
import { BetaBanner } from "./components/beta-banner";
import ConditionalFooter from "./components/conditional-footer";
import { CookieBanner } from "./components/cookie-banner";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LivePass - Marketplace de Bilhética",
  description: "Compre bilhetes digitais seguros para os melhores eventos em Portugal",
  metadataBase: new URL("https://tickets.daowave.pt"),
  applicationName: "LivePass",
};

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: "#0c0c12" },
      { media: "(prefers-color-scheme: light)", color: "#0c0c12" },
    ] as const,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${dmSans.variable} min-h-screen font-sans antialiased`}>
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
