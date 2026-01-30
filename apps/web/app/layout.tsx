import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import ConditionalNav from "./components/conditional-nav";
import { BetaBanner } from "./components/beta-banner";
import ConditionalFooter from "./components/conditional-footer";

export const metadata: Metadata = {
  title: "EasyTicket - Marketplace de Bilhética",
  description: "Compre bilhetes digitais seguros para os melhores eventos em Portugal",
  metadataBase: new URL("https://ticket.daowave.pt"),
  applicationName: "EasyTicket",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0F" },
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--background))] text-foreground antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <BetaBanner />
            <ConditionalNav />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}