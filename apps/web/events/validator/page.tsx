export default function ValidatorHome() {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Validator</h1>
          <p className="mt-2 text-sm text-zinc-300">
            MVP online-first: cola o token do QR e faz check-in atómico.
          </p>
        </div>
  
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <div className="text-sm font-semibold">Check-in</div>
          <form action="/api/validator/checkin" method="post" className="mt-3 flex flex-col gap-3 md:flex-row">
            <input name="token" placeholder="QR token (body.sig)" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            <input name="deviceId" defaultValue="DEV-LOCAL-1" className="w-full md:w-56 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950">Check-in</button>
          </form>
        </div>
      </div>
    );
  }
  