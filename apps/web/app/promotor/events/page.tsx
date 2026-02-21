"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, MapPin, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Event {
    id: string;
    title: string;
    startAt: string;
    status: string;
    venue: string;
    _count: {
        tickets: number;
        orders: number;
    };
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/promotor/events")
            .then((res) => res.json())
            .then((data) => {
                if (data.events) setEvents(data.events);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
                <Link href="/promotor/events/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Criar Evento
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Os seus eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">A carregar...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Não tem eventos criados.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 transition"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 rounded bg-zinc-100 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-zinc-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{event.title}</h3>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {format(new Date(event.startAt), "PPP", { locale: pt })}
                                                <MapPin className="ml-3 mr-1 h-3 w-3" />
                                                {event.venue}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{event._count.tickets} bilhetes</div>
                                            <div className="text-xs text-muted-foreground">{event._count.orders} encomendas</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                                event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {event.status}
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
