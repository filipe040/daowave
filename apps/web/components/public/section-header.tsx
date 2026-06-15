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
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a0e3] mb-1.5">
          {subtitle}
        </p>
      )}
      <div className="flex items-center gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-[#5ec8f8] transition-colors shrink-0"
          >
            {linkLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
