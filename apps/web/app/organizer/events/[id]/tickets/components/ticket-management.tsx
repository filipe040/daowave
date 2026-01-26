"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import TicketTypeForm from "./ticket-type-form";
import TicketLotForm from "./ticket-lot-form";

interface TicketLot {
  id: string;
  name: string;
  price: number;
  startsAt: Date;
  endsAt: Date;
  stockTotal: number;
  stockSold: number;
}

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: string;
  lots: TicketLot[];
}

interface Event {
  id: string;
  title: string;
  ticketLots: any[]; // Use ticketLots instead of ticketTypes
}

interface TicketManagementProps {
  eventId: string;
  event: Event;
}

export default function TicketManagement({ eventId, event }: TicketManagementProps) {
  // TODO: Adapt to use ticketLots directly instead of ticketTypes
  const [ticketTypes, setTicketTypes] = useState<any[]>([]); // Empty until adapted
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showLotForm, setShowLotForm] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const refreshData = async () => {
    const res = await fetch(`/api/organizer/events/${eventId}/tickets`);
    const data = await res.json();
    // TODO: Adapt API to return ticketLots structure
    if (data.ticketTypes) {
      setTicketTypes(data.ticketTypes);
    } else if (data.ticketLots) {
      setTicketTypes(data.ticketLots);
    }
  };

  const handleTypeCreated = () => {
    setShowTypeForm(false);
    refreshData();
  };

  const handleLotCreated = () => {
    setShowLotForm(false);
    setSelectedTypeId(null);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Tipos de Bilhetes</h2>
          <p className="text-sm text-zinc-400">
            Crie tipos de bilhetes e lotes para o seu evento
          </p>
        </div>
        <button
          onClick={() => setShowTypeForm(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
        >
          + Criar Tipo de Bilhete
        </button>
      </div>

      {/* Ticket Types List */}
      {ticketTypes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🎫</div>
          <p className="text-lg text-zinc-400 mb-2">Ainda não há tipos de bilhetes</p>
          <p className="text-sm text-zinc-500 mb-6">
            Crie o primeiro tipo de bilhete para começar a vender
          </p>
          <button
            onClick={() => setShowTypeForm(true)}
            className="inline-block rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105"
          >
            Criar Tipo de Bilhete
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {ticketTypes.map((type: any) => (
            <div
              key={type.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-zinc-400 mb-2">{type.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span>Preço base: {(type.basePrice / 100).toFixed(2)} {type.currency}</span>
                    <span>•</span>
                    <span>{(type.lots || []).length} lote(s)</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setShowLotForm(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors"
                >
                  + Adicionar Lote
                </button>
              </div>

              {/* Lots List */}
              {(type.lots || []).length === 0 ? (
                <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
                  <p className="text-sm text-zinc-500 mb-3">Nenhum lote criado ainda</p>
                  <button
                    onClick={() => {
                      setSelectedTypeId(type.id);
                      setShowLotForm(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors"
                  >
                    Criar Primeiro Lote
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {(type.lots || []).map((lot: any) => {
                    const available = lot.stockTotal - lot.stockSold;
                    const isActive =
                      new Date(lot.startsAt) <= new Date() &&
                      new Date(lot.endsAt) >= new Date();
                    const isExpired = new Date(lot.endsAt) < new Date();
                    const isUpcoming = new Date(lot.startsAt) > new Date();

                    return (
                      <div
                        key={lot.id}
                        className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{lot.name}</h4>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  isExpired
                                    ? "bg-red-500/20 text-red-400"
                                    : isUpcoming
                                    ? "bg-blue-500/20 text-blue-400"
                                    : isActive
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {isExpired
                                  ? "Expirado"
                                  : isUpcoming
                                  ? "Agendado"
                                  : isActive
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-400">
                              <div>
                                <span className="text-zinc-500">Preço:</span>{" "}
                                {(lot.price / 100).toFixed(2)} {type.currency}
                              </div>
                              <div>
                                <span className="text-zinc-500">Disponível:</span> {available} /{" "}
                                {lot.stockTotal}
                              </div>
                              <div>
                                <span className="text-zinc-500">Início:</span>{" "}
                                {format(new Date(lot.startsAt), "dd MMM yyyy, HH:mm", {
                                  locale: pt,
                                })}
                              </div>
                              <div>
                                <span className="text-zinc-500">Fim:</span>{" "}
                                {format(new Date(lot.endsAt), "dd MMM yyyy, HH:mm", {
                                  locale: pt,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showTypeForm && (
        <TicketTypeForm
          eventId={eventId}
          onClose={() => setShowTypeForm(false)}
          onSuccess={handleTypeCreated}
        />
      )}

      {showLotForm && selectedTypeId && (
        <TicketLotForm
          eventId={eventId}
          ticketTypeId={selectedTypeId}
          onClose={() => {
            setShowLotForm(false);
            setSelectedTypeId(null);
          }}
          onSuccess={handleLotCreated}
        />
      )}
    </div>
  );
}

