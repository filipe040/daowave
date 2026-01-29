 "use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AccountUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
}

interface TicketItem {
  id: string;
  code: string;
  checkedInAt: string | null;
  entriesUsed: number;
  lastCheckinAt: string | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    slug?: string;
  } | null;
  ticketLot?: {
    id: string;
    name: string;
  } | null;
}

interface AccountProfileProps {
  user: AccountUser;
}

export default function AccountProfile({ user }: AccountProfileProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tickets
  const [activeTab, setActiveTab] = useState<"profile" | "tickets">("profile");
  const [tickets, setTickets] = useState<TicketItem[] | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // transfer modal
  const [transferingTicket, setTransferingTicket] = useState<TicketItem | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    setTicketsError(null);
    try {
      const res = await fetch("/api/account/tickets");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao obter bilhetes");
      }
      setTickets(data.tickets ?? []);
    } catch (e: any) {
      setTicketsError(e?.message || "Erro ao obter bilhetes");
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setToast(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar nome");
      }

      setToast({ type: "success", message: "Nome atualizado com sucesso." });
      router.refresh();
      // notify other tabs/components about session/user update
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("daowave-session");
          bc.postMessage({ type: "session:update", name: name.trim() || null });
          bc.close();
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao atualizar nome",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Apenas imagens são permitidas." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "Ficheiro demasiado grande (máx. 5MB)." });
      return;
    }

    setUploading(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar foto de perfil");
      }

      setAvatarUrl(data.avatarUrl ?? null);
      setToast({ type: "success", message: "Foto de perfil atualizada." });
      router.refresh();
      // notify other tabs/components about avatar update
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("daowave-session");
          bc.postMessage({ type: "session:update", avatarUrl: data.avatarUrl ?? null });
          bc.close();
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Erro ao atualizar foto de perfil",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials =
    (user.name || user.email)
      ?.split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const openTransfer = (t: TicketItem) => {
    setTransferingTicket(t);
    setTransferEmail("");
  };

  const closeTransfer = () => {
    setTransferingTicket(null);
    setTransferEmail("");
    setTransferLoading(false);
  };

  const submitTransfer = async () => {
    if (!transferingTicket || !transferEmail) {
      setToast({ type: "error", message: "Email do destinatário é obrigatório." });
      return;
    }
    setTransferLoading(true);
    try {
      const res = await fetch("/api/account/tickets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: transferingTicket.id, recipientEmail: transferEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao transferir bilhete");
      }
      setToast({ type: "success", message: "Bilhete transferido com sucesso." });
      closeTransfer();
      fetchTickets();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Erro ao transferir bilhete" });
      setTransferLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm ${
              toast.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {toast.message}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-6">
          Conta e perfil
        </h1>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-800 border border-slate-300"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-white">
                    ...
                  </div>
                )}
              </button>
              <div>
                <p className="text-sm text-slate-500">Perfil</p>
                <p className="text-sm font-semibold text-slate-900">{user.name || user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {user.role}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="pt-3 border-t border-slate-200">
            <nav className="flex gap-3 mb-4">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === "profile" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === "tickets" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Meus Bilhetes
              </button>
            </nav>

            {activeTab === "profile" && (
              <form onSubmit={handleNameSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Nome de utilizador
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="O teu nome"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingName}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingName ? "A guardar..." : "Guardar alterações"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "tickets" && (
              <div>
                {loadingTickets && <div className="text-sm text-slate-500">A carregar bilhetes...</div>}
                {ticketsError && <div className="text-sm text-red-600">{ticketsError}</div>}
                {!loadingTickets && tickets && tickets.length === 0 && (
                  <div className="text-sm text-slate-500">Ainda não tens bilhetes.</div>
                )}

                <div className="space-y-3">
                  {tickets?.map((t) => (
                    <div key={t.id} className="border rounded-md p-3 flex items-center justify-between bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">{t.event?.title || "Evento"}</div>
                        <div className="text-xs text-slate-500">Código: {t.code}</div>
                        <div className="text-xs text-slate-500">
                          Compra: {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTransfer(t)}
                          className="px-3 py-1 rounded-md bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Transferir
                        </button>
                        <a
                          href={`/events/${t.event?.slug ?? t.event?.id}`}
                          className="px-3 py-1 rounded-md bg-blue-600 text-sm text-white"
                        >
                          Ver evento
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer modal */}
      {transferingTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Transferir bilhete</h3>
            <p className="text-sm text-slate-600 mb-4">Bilhete: {transferingTicket.code} — {transferingTicket.event?.title}</p>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">Email do destinatário</label>
            <input
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              type="email"
              placeholder="email@exemplo.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeTransfer} className="px-3 py-2 rounded-md bg-slate-100">Cancelar</button>
              <button onClick={submitTransfer} disabled={transferLoading} className="px-3 py-2 rounded-md bg-blue-600 text-white">
                {transferLoading ? "A processar..." : "Confirmar Transferência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

