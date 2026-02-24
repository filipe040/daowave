"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import Link from "next/link";
import { ArrowLeft, Ticket, Layers, Map as MapIcon } from "lucide-react";
import TicketTypesTab from "./TicketTypesTab";
import TicketLotsTab from "./TicketLotsTab";
import SeatMapsTab from "./SeatMapsTab";

const TABS = [
    { id: "types", label: "Tipos de Bilhete", icon: Ticket },
    { id: "lots", label: "Lotes & Preços", icon: Layers },
    { id: "seats", label: "Mapa de Lugares", icon: MapIcon },
];

export default function BilhetesPage() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState("types");

    return (
        <PageShell
            title="Gestão de Bilhetes e Lotação"
            subtitle="Configure os tipos de bilhetes, preços e a planta da sala."
            actions={
                <Link
                    href={`/promotor/events/${id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Evento
                </Link>
            }
        >
            <div className="max-w-5xl space-y-6">

                {/* Apple-like Segmented Control Tab Bar */}
                <div className="p-1.5 bg-white/5 border border-white/10 rounded-2xl inline-flex w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-white text-black shadow-lg scale-100"
                                    : "text-white/50 hover:text-white hover:bg-white/5 scale-95 hover:scale-100"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-black" : "text-white/40"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Area */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden min-h-[400px] relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    {activeTab === "types" && <TicketTypesTab eventId={id} />}
                    {activeTab === "lots" && <TicketLotsTab eventId={id} />}
                    {activeTab === "seats" && <SeatMapsTab eventId={id} />}
                </div>

            </div>
        </PageShell>
    );
}
