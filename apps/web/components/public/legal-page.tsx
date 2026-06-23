import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="public-shell min-h-screen">
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-10 sm:pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#5ec8f8] transition-colors mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            LivePass
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00a0e3] mb-2">
                Informação Legal
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-zinc-400 max-w-xl">{subtitle}</p>
              )}
            </div>
            {updated && (
              <span className="flex-shrink-0 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-500">
                Atualizado em {updated}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number?: string | number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#14141f] p-5 sm:p-6 lg:p-8">
      <div className="flex items-start gap-3 mb-4">
        {number !== undefined && (
          <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[#00a0e3]/10 border border-[#00a0e3]/25 text-[#5ec8f8] text-[10px] font-bold flex items-center justify-center">
            {number}
          </span>
        )}
        <h2 className="text-sm font-bold text-white leading-snug">{title}</h2>
      </div>
      <div
        className={`text-sm text-zinc-400 leading-relaxed space-y-3 ${
          number !== undefined ? "sm:pl-9" : ""
        } [&_strong]:text-zinc-200 [&_a]:text-[#00a0e3] [&_a:hover]:underline [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:leading-relaxed`}
      >
        {children}
      </div>
    </div>
  );
}

export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#00a0e3]/20 bg-[#00a0e3]/5 p-5 sm:p-6">
      <div className="text-sm text-zinc-300 leading-relaxed [&_a]:text-[#5ec8f8] [&_a:hover]:underline [&_strong]:text-white">
        {children}
      </div>
    </div>
  );
}
