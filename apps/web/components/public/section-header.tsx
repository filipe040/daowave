import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "Ver todos",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="min-w-0">
      {subtitle && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00a0e3]/10 border border-[#00a0e3]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5ec8f8] mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00a0e3] inline-block" />
          {subtitle}
        </span>
      )}
      <div className="flex items-center gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-[#5ec8f8] transition-colors shrink-0"
          >
            {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
