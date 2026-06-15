"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Ticket } from "lucide-react";
import { isStaffAccount } from "@/lib/auth/public-nav";

export default function Footer() {
  const year = new Date().getFullYear();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const hasOrgAccess =
    (session?.user as { hasOrgAccess?: boolean })?.hasOrgAccess === true;
  const isStaff = isStaffAccount(role, hasOrgAccess);

  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-[#08080e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00a0e3] to-[#0066aa] flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">LivePass</h3>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">Bilhética digital</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-sm">
                Bilhetes para os melhores eventos em Portugal. Compra segura, QR instantâneo e check-in em tempo real.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Cartão", "Visa", "Mastercard"].map((t) => (
                  <span key={t} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-400">
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-zinc-600">Pagamento seguro processado pela Stripe</p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-4">Compradores</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/events" className="text-zinc-400 hover:text-[#5ec8f8] transition">Explorar eventos</Link></li>
                {!isStaff && (
                  <li><Link href="/my-tickets" className="text-zinc-400 hover:text-[#5ec8f8] transition">Meus bilhetes</Link></li>
                )}
                <li><Link href="/politica-reembolsos" className="text-zinc-400 hover:text-[#5ec8f8] transition">Reembolsos</Link></li>
                <li><Link href="/help" className="text-zinc-400 hover:text-[#5ec8f8] transition">Ajuda</Link></li>
                <li><Link href="/faq" className="text-zinc-400 hover:text-[#5ec8f8] transition">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-4">Promotores</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/auth/signin?register=organizer" className="text-zinc-400 hover:text-[#5ec8f8] transition">Criar conta</Link></li>
                <li><Link href="/promotor" className="text-zinc-400 hover:text-[#5ec8f8] transition">Área do promotor</Link></li>
                <li><Link href="/sobre-nos" className="text-zinc-400 hover:text-[#5ec8f8] transition">Sobre nós</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/terms" className="text-zinc-400 hover:text-[#5ec8f8] transition">Termos</Link></li>
                <li><Link href="/privacy" className="text-zinc-400 hover:text-[#5ec8f8] transition">Privacidade</Link></li>
                <li><Link href="/cookies" className="text-zinc-400 hover:text-[#5ec8f8] transition">Cookies</Link></li>
                <li><Link href="/ral" className="text-zinc-400 hover:text-[#5ec8f8] transition">RAL</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© {year} LivePass. Todos os direitos reservados.</p>
          <a href="mailto:suporte@livepass.pt" className="text-sm text-zinc-400 hover:text-[#5ec8f8] transition">
            suporte@livepass.pt
          </a>
        </div>
      </div>
    </footer>
  );
}
