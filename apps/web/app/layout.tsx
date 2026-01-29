import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import ConditionalNav from "./components/conditional-nav";
import { BetaBanner } from "./components/beta-banner";
import ConditionalFooter from "./components/conditional-footer";

export const metadata: Metadata = {
  title: "7even Tickets - Marketplace de Bilhética",
  description: "Compre bilhetes digitais seguros para os melhores eventos em Portugal",
  metadataBase: new URL("https://ticket.daowave.pt"),
  applicationName: "7even Tickets",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0F" },
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
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