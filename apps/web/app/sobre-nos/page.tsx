import Link from "next/link";
import { ArrowLeft, Music, MapPin, Shield } from "lucide-react";

export const metadata = {
    title: "Sobre Nós — Daowave Bilhetes",
    description:
        "Somos uma plataforma portuguesa de bilhética digital, criada para ligar promotores de eventos ao seu público de forma simples e segura.",
};

export default function SobreNosPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition mb-10"
                >
                    <ArrowLeft className="h-4 w-4" /> Início
                </Link>

                <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">A empresa</div>
                <h1 className="text-[32px] sm:text-[40px] font-semibold text-white leading-tight mb-6">
                    Sobre Nós
                </h1>

                <div className="space-y-8 text-[15px] text-white/65 leading-relaxed">
                    <p>
                        A <span className="text-white font-medium">Daowave</span> é uma plataforma de bilhética
                        digital 100% portuguesa, criada para simplificar a venda de bilhetes para eventos ao vivo.
                        Acreditamos que comprar um bilhete deve ser tão fácil como enviar uma mensagem.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Music, title: "Para o público", desc: "Compra em segundos, entra com QR." },
                            { icon: MapPin, title: "Para promotores", desc: "Cria eventos, vende e analisa." },
                            { icon: Shield, title: "Para todos", desc: "Bilhetes protegidos contra fraude." },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-white/10 bg-white/4 p-5"
                            >
                                <item.icon className="h-5 w-5 text-white/50 mb-3" strokeWidth={1.75} />
                                <div className="text-[14px] font-semibold text-white/85 mb-1">{item.title}</div>
                                <div className="text-[13px] text-white/45">{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <p>
                        Trabalhamos com promotores independentes e organizações de todo o país, oferecendo
                        ferramentas profissionais de gestão de eventos, check-in com QR code, relatórios de
                        vendas em tempo real e suporte dedicado.
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
                        <div className="text-[13px] font-semibold text-white/70 mb-3 uppercase tracking-wider">
                            Contacto
                        </div>
                        <div className="space-y-2 text-[14px] text-white/55">
                            <div>📧 <a href="mailto:suporte@daowave.pt" className="hover:text-white transition">suporte@daowave.pt</a></div>
                            <div>📍 Lisboa, Portugal</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
