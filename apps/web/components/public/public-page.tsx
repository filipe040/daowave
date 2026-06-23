import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PublicPage({
  children,
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={`public-shell min-h-screen ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[#5ec8f8] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

export function PublicCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#14141f] p-5 sm:p-6 lg:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function PublicEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#14141f] py-12 sm:py-16 px-6 text-center">
      <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-600 mx-auto mb-4" />
      <p className="text-white font-semibold text-base sm:text-lg">{title}</p>
      <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PublicButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "bg-[#00a0e3] text-white hover:bg-[#0090cc] shadow-lg shadow-[#00a0e3]/20"
      : "border border-white/15 bg-white/5 text-white hover:bg-white/10";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors ${cls}`}
    >
      {children}
    </Link>
  );
}
