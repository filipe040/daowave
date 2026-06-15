"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/dashboard/PageShell";
import { InvoiceThemeEditor } from "@/components/promoter/InvoiceThemeEditor";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { ArrowLeft } from "lucide-react";
import { EventStudioNav } from "@/components/promoter/EventStudioNav";

export default function EventInvoicesPage() {
  const { id } = useParams<{ id: string }>();
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    fetchWithTimeout(`/api/promotor/events/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.title) setEventTitle(data.title);
      })
      .catch(() => {});
  }, [id]);

  return (
    <PageShell
      title="Faturas do Evento"
      subtitle="Override opcional do design de faturas para este evento"
      actions={
        <Link
          href={`/promotor/events/${id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao evento
        </Link>
      }
    >
      <div className="max-w-3xl space-y-6">
        <EventStudioNav eventId={id} />
        <InvoiceThemeEditor scope="event" eventId={id} eventTitle={eventTitle} />
      </div>
    </PageShell>
  );
}
