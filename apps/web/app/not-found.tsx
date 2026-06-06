import Link from "next/link";
import { Home, Calendar, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient text-neutral-900 px-6">
      <div className="relative w-full max-w-2xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-neutral-50 blur-3xl" />

        <div className="relative rounded-3xl border border-neutral-200 bg-white shadow-md p-10 sm:p-14 text-center shadow-lg">
          <div className="text-[72px] font-semibold tracking-tight text-neutral-900">404</div>

          <h1 className="mt-2 text-[20px] sm:text-[24px] font-semibold text-neutral-900">
            Página não encontrada
          </h1>

          <p className="mt-2 text-[13px] sm:text-[14px] text-neutral-500">
            O recurso que procuras não existe ou foi movido.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-[13px] font-semibold text-white shadow-md transition-all hover:bg-violet-700"
            >
              <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </span>
              Início
            </Link>

            <Link
              href="/events"
              className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-5 py-3 text-[13px] font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
            >
              <span className="h-7 w-7 rounded-full bg-neutral-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-neutral-600" />
              </span>
              Eventos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}