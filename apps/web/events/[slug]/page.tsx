export const dynamic = "force-dynamic";

async function getEvent(slug: string) {
  // Use server-side URL detection
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/events/${slug}`, { cache: "no-store" });
  return res.json();
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEvent(slug);
  const e = data.event;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">{e.title}</h1>
        <p className="mt-2 text-zinc-300">{e.city} • {new Date(e.startAt).toLocaleString("pt-PT")}</p>
        <p className="mt-4 max-w-2xl text-sm text-zinc-300">{e.description}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.lots.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950 p-4">
              <div>
                <div className="text-sm font-semibold">{l.ticketTypeName} — {l.name}</div>
                <div className="text-xs text-zinc-300">{(l.price/100).toFixed(2)} {l.currency} • Stock: {l.stockTotal - l.stockSold}</div>
              </div>
              <span className="rounded-lg border border-white/15 px-2 py-1 text-xs text-zinc-200">MVP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
