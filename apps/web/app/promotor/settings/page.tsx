"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { ShieldAlert } from "lucide-react";

export default function PromoterSettingsPage() {
    return (
        <PageShell title="Configurações" subtitle="Definições da organização">
            <div className="max-w-xl">
                <div className="bg-amber-400/5 backdrop-blur-xl rounded-3xl border border-amber-400/20 p-8 flex flex-col items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-amber-400/10 flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-neutral-900 mb-1">Acesso restrito</h2>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            As configurações da organização são geridas pelo administrador da plataforma.<br />
                            Para editar os dados da organização, contacte um administrador.
                        </p>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
