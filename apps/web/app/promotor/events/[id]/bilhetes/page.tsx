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
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar ao Evento
                </Link>
            }
        >
            <div className="max-w-5xl space-y-6">

                {/* Apple-like Segmented Control Tab Bar */}
                <div className="p-1 bg-gray-100/80 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Area */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                    {activeTab === "types" && <TicketTypesTab eventId={id} />}
                    {activeTab === "lots" && <TicketLotsTab eventId={id} />}
                    {activeTab === "seats" && <SeatMapsTab eventId={id} />}
                </div>

            </div>
        </PageShell>
    );
}
