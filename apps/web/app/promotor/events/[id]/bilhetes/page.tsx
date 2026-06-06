"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import Link from "next/link";
import { ArrowLeft, Ticket, Layers, Map as MapIcon, Mic2 } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import TicketTypesTab from "./TicketTypesTab";
import TicketLotsTab from "./TicketLotsTab";
import SeatMapsTab from "./SeatMapsTab";
import ArtistsTab from "./ArtistsTab";

const TABS = [
    { id: "artists", label: "Artistas", icon: Mic2 },
    { id: "types", label: "Tipos de Bilhete", icon: Ticket },
    { id: "lots", label: "Lotes & Preços", icon: Layers },
    { id: "seats", label: "Mapa de Lugares", icon: MapIcon },
];

export default function BilhetesPage() {
    const { id } = useParams<{ id: string }>();

    const [activeTab, setActiveTab] = useState("artists");
    const [eventSlug, setEventSlug] = useState<string | undefined>();
    const [layoutMode, setLayoutMode] = useState<string>("STANDARD");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "artists" || tab === "types" || tab === "lots" || tab === "seats") {
            setActiveTab(tab);
        }
    }, []);

    useEffect(() => {
        fetchWithTimeout(`/api/promotor/events/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setEventSlug(data.slug);
                setLayoutMode(data.layoutMode || "STANDARD");
            })
            .catch(() => {});
    }, [id]);

    return (
        <PageShell
            title="Gestão de Bilhetes e Lotação"
            subtitle={
                layoutMode === "ARTISTS"
                    ? "Modo artistas: configure cada artista com poster, data e preço."
                    : "Configure bilhetes, artistas, preços e mapa de lugares."
            }
            actions={
                <Link
                    href={`/promotor/events/${id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Evento
                </Link>
            }
        >
            <div className="max-w-5xl space-y-6">
                <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded-2xl inline-flex w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-violet-600 text-white shadow-lg scale-100"
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 scale-95 hover:scale-100"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-neutral-900" : "text-neutral-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white shadow-md overflow-hidden min-h-[400px] relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                    {activeTab === "artists" && (
                        <ArtistsTab
                            eventId={id}
                            eventSlug={eventSlug}
                            layoutMode={layoutMode}
                            onLayoutModeChange={setLayoutMode}
                        />
                    )}
                    {activeTab === "types" && <TicketTypesTab eventId={id} />}
                    {activeTab === "lots" && <TicketLotsTab eventId={id} />}
                    {activeTab === "seats" && <SeatMapsTab eventId={id} />}
                </div>
            </div>
        </PageShell>
    );
}
