import Link from "next/link";
import { Home, Calendar, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="public-shell min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-7xl sm:text-8xl font-black text-white/10 tabular-nums">404</p>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white">Página não encontrada</h1>
        <p className="mt-2 text-sm text-zinc-400">
          O recurso que procuras não existe ou foi movido.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#00a0e3] px-6 py-3 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="h-4 w-4" />
            Início
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors w-full sm:w-auto justify-center"
          >
            <Calendar className="h-4 w-4" />
            Eventos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
