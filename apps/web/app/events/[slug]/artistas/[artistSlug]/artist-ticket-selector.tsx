"use client";

import { TicketSelector } from "../../ticket-selector";

export function ArtistTicketSelector({
    event,
    filterTypeId,
    presaveEnabled = true,
    userEmail,
    userName,
}: {
    event: { id: string; title: string; slug: string };
    filterTypeId: string;
    presaveEnabled?: boolean;
    userEmail?: string | null;
    userName?: string | null;
}) {
    return (
        <TicketSelector
            event={event}
            ticketLots={[]}
            filterTypeId={filterTypeId}
            variant="light"
            presaveEnabled={presaveEnabled}
            userEmail={userEmail}
            userName={userName}
        />
    );
}
