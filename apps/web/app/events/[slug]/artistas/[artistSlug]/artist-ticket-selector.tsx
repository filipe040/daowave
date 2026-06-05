"use client";

import { TicketSelector } from "../../ticket-selector";

export function ArtistTicketSelector({
    event,
    filterTypeId,
}: {
    event: { id: string; title: string; slug: string };
    filterTypeId: string;
}) {
    return (
        <TicketSelector
            event={event}
            ticketLots={[]}
            filterTypeId={filterTypeId}
            variant="light"
        />
    );
}
