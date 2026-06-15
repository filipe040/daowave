"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Code2, Globe } from "lucide-react";
import { toast } from "sonner";

export function ArtistsApiPanel({ eventSlug }: { eventSlug: string }) {
    const [copied, setCopied] = useState<string | null>(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const apiUrl = `${baseUrl}/api/public/v1/events/${eventSlug}/artists`;

    const fetchExample = useMemo(
        () => `fetch("${apiUrl}")
  .then((res) => res.json())
  .then((data) => {
    // data.artists — lista de artistas com preços, datas e URLs de compra
    data.artists.forEach((artist) => {
      console.log(artist.name, artist.price.formatted, artist.urls.ticketPage);
    });
  });`,
        [apiUrl]
    );

    const copy = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            toast.success("Copiado!");
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error("Não foi possível copiar");
        }
    };

    return (
        <div className="mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-white">API para site externo</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-6 max-w-2xl leading-relaxed">
                Use este endpoint num site externo (WordPress, landing page, app mobile) para listar todos os artistas com preços, datas e links de compra. CORS aberto — funciona com <code className="text-zinc-400">fetch</code> no browser.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                        Endpoint (GET)
                    </label>
                    <div className="flex gap-2">
                        <code className="flex-1 rounded-xl bg-[#0c0c12] border border-white/10 px-4 py-3 text-[13px] text-emerald-300 font-mono break-all">
                            {apiUrl}
                        </code>
                        <button
                            type="button"
                            onClick={() => copy(apiUrl, "url")}
                            className="shrink-0 px-4 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
                            title="Copiar URL"
                        >
                            {copied === "url" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                        <Code2 className="h-3.5 w-3.5" />
                        Exemplo JavaScript
                    </label>
                    <div className="relative">
                        <pre className="rounded-xl bg-[#0c0c12] border border-white/10 p-4 text-[12px] text-zinc-200 font-mono overflow-x-auto leading-relaxed">
                            {fetchExample}
                        </pre>
                        <button
                            type="button"
                            onClick={() => copy(fetchExample, "code")}
                            className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            {copied === "code" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-[12px] text-zinc-500 space-y-1">
                    <p><span className="text-zinc-400 font-semibold">Resposta:</span> JSON com <code className="text-zinc-400">event</code>, <code className="text-zinc-400">artists[]</code> e URLs absolutas em <code className="text-zinc-400">urls.ticketPage</code>.</p>
                    <p>Cache: 60s. Apenas eventos publicados. Artistas com <code className="text-zinc-400">isPublished: true</code>.</p>
                </div>
            </div>
        </div>
    );
}
