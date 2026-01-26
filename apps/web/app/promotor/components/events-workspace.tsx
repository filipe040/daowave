"use client";

import { useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  slug: string;
  title: string;
  status: string;
  city: string;
  startAt: Date | string;
  _count: {
    tickets: number;
    orders: number;
  };
}

interface EventsWorkspaceProps {
  events: Event[];
}

export default function EventsWorkspace({ events: initialEvents }: EventsWorkspaceProps) {
  const [search, setSearch] = useState("");
  
  const filteredEvents = initialEvents.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-0 top-0 bottom-0 flex items-center text-white/50 pl-2 sm:pl-3">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="PESQUISAR PROJETO..."
          className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 pl-8 sm:pl-10 pr-4 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors uppercase text-xs sm:text-sm md:text-base"
        />
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 sm:py-16 md:py-20">
          <p className="text-white/50 text-sm sm:text-base uppercase">
            {search ? "Nenhum projeto encontrado" : "Nenhum projeto criado"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/promotor/events/${event.id}`}
              className="group border border-white/20 rounded-lg p-4 sm:p-5 md:p-6 hover:border-white/40 transition-all hover:bg-white/5"
            >
              {/* Project Code and Arrow */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm text-white/50 uppercase tracking-wider">
                  {event.slug.toUpperCase()}
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 border border-white/30 flex items-center justify-center group-hover:border-white transition-colors">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                <span className="text-xs sm:text-sm text-white/50 uppercase">
                  {event.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
                </span>
              </div>

              {/* Event Title */}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8 uppercase leading-tight">
                {event.title}
              </h3>

              {/* Event Info */}
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="uppercase">SETOR</span>
                  <span>{event.city.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="uppercase">TEMPORAL</span>
                  <span>
                    {new Date(event.startAt).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
