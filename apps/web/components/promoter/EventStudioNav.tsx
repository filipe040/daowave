"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Ticket,
  Brush,
  Users,
  ShieldCheck,
  BarChart3,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: (id: string) => `/promotor/events/${id}`, label: "Geral", icon: LayoutGrid, match: (p: string, id: string) => p === `/promotor/events/${id}` },
  { href: (id: string) => `/promotor/events/${id}/bilhetes`, label: "Bilhetes", icon: Ticket, match: (p: string) => p.includes("/bilhetes") },
  { href: (id: string) => `/promotor/sales?eventId=${id}`, label: "Vendas", icon: CreditCard, match: (p: string) => p.includes("/sales") },
  { href: (id: string) => `/promotor/checkin?eventId=${id}`, label: "Check-in", icon: ShieldCheck, match: (p: string) => p.includes("/checkin") },
  { href: (id: string) => `/promotor/events/${id}/teams`, label: "Equipa", icon: Users, match: (p: string) => p.includes("/teams") },
  { href: (id: string) => `/promotor/events/${id}/branding`, label: "Branding", icon: Brush, match: (p: string) => p.includes("/branding") },
  { href: (id: string) => `/promotor/events/${id}/tracking-links`, label: "Links", icon: BarChart3, match: (p: string) => p.includes("/tracking-links") },
  { href: (id: string) => `/promotor/events/${id}/invoices`, label: "Faturas", icon: FileText, match: (p: string) => p.includes("/invoices") },
] as const;

export function EventStudioNav({ eventId }: { eventId: string }) {
  const pathname = usePathname() || "";

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl border border-white/10 bg-white/[0.03]"
      aria-label="Navegação do evento"
    >
      {LINKS.map((link) => {
        const href = link.href(eventId);
        const active = link.match(pathname, eventId);
        const Icon = link.icon;
        return (
          <Link
            key={link.label}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all",
              active
                ? "bg-[#00a0e3] text-white shadow-lg shadow-[#00a0e3]/20"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
