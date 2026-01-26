import "./globals.css";
import { Providers } from "./providers";
import ConditionalNav from "./components/conditional-nav";
import { BetaBanner } from "./components/beta-banner";
import ConditionalFooter from "./components/conditional-footer";

export const metadata = {
  title: "7even Tickets - Marketplace de Bilhética",
  description: "Compre bilhetes digitais seguros para os melhores eventos em Portugal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen bg-black text-white">
            <BetaBanner />
            <ConditionalNav />
            <main className="min-h-screen">{children}</main>
            <ConditionalFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
