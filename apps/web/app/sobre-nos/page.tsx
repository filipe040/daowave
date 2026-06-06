import Link from "next/link";
import { ArrowLeft, Music, MapPin, Shield } from "lucide-react";

export const metadata = {
    title: "Sobre Nós — GoPass Bilhetes",
    description:
        "Somos uma plataforma portuguesa de bilhética digital, criada para ligar promotores de eventos ao seu público de forma simples e segura.",
};

export default function SobreNosPage() {
    return (
        <div className="min-h-screen mesh-gradient text-neutral-900">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-violet-600 font-semibold transition mb-10"
                >
                    <ArrowLeft className="h-4 w-4" /> Início
                </Link>

                <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold mb-2">A empresa</div>
                <h1 className="text-[32px] sm:text-[40px] font-black text-neutral-900 leading-tight mb-6">
                    Sobre Nós
                </h1>

                <div className="space-y-8 text-[15px] text-neutral-700 leading-relaxed">
                    <p>
                        A <span className="text-neutral-900 font-bold">GoPass</span> é uma plataforma de bilhética
                        digital 100% portuguesa, criada para simplificar a venda de bilhetes para eventos ao vivo.
                        Acreditamos que comprar um bilhete deve ser tão fácil como enviar uma mensagem.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Music, title: "Para o público", desc: "Compra em segundos, entra com QR.", color: "violet" },
                            { icon: MapPin, title: "Para promotores", desc: "Cria eventos, vende e analisa.", color: "fuchsia" },
                            { icon: Shield, title: "Para todos", desc: "Bilhetes protegidos contra fraude.", color: "emerald" },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                            >
                                <item.icon className={`h-5 w-5 mb-3 ${item.color === "violet" ? "text-violet-600" : item.color === "fuchsia" ? "text-fuchsia-600" : "text-emerald-600"}`} strokeWidth={1.75} />
                                <div className="text-[14px] font-bold text-neutral-900 mb-1">{item.title}</div>
                                <div className="text-[13px] text-neutral-600">{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <p>
                        Trabalhamos com promotores independentes e organizações de todo o país, oferecendo
                        ferramentas profissionais de gestão de eventos, check-in com QR code, relatórios de
                        vendas em tempo real e suporte dedicado.
                    </p>

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                        <div className="text-[13px] font-bold text-violet-800 mb-3 uppercase tracking-wider">
                            Contacto
                        </div>
                        <div className="space-y-2 text-[14px] text-neutral-700">
                            <div>📧 <a href="mailto:suporte@gopass.pt" className="text-violet-700 font-semibold hover:underline">suporte@gopass.pt</a></div>
                            <div>📍 Viseu, Portugal</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
