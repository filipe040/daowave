export const dynamic = "force-dynamic";

async function getEvents() {
  // Use server-side URL detection
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/events`, { cache: "no-store" });
  return res.json();
}

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Eventos</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {events.map((e: any) => (
          <a key={e.id} href={`/events/${e.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="aspect-[16/9] rounded-xl bg-white/10" />
            <div className="mt-4">
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-zinc-300">{e.city} • {new Date(e.startAt).toLocaleString("pt-PT")}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
