import Link from "next/link";
import { Home, Calendar, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="relative w-full max-w-2xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 sm:p-14 text-center shadow-[0_18px_60px_rgba(0,0,0,.6)]">
          <div className="text-[72px] font-semibold tracking-tight text-white/90">404</div>

          <h1 className="mt-2 text-[20px] sm:text-[24px] font-semibold text-white/90">
            Página não encontrada
          </h1>

          <p className="mt-2 text-[13px] sm:text-[14px] text-white/55">
            O recurso que procuras não existe ou foi movido.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/90 px-5 py-3 text-[13px] font-semibold text-black/90 shadow-[0_18px_60px_rgba(0,0,0,.18)] transition-all hover:bg-white hover:shadow-[0_18px_60px_rgba(0,0,0,.26)]"
            >
              <span className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center">
                <Home className="h-4 w-4 text-black/80" />
              </span>
              Início
            </Link>

            <Link
              href="/events"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/8 transition-all"
            >
              <span className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white/70" />
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