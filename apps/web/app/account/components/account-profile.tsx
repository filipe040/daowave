"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

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

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function formatDT(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("pt-PT");
}

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "PROMOTER") return "Promotor";
  if (role === "USER") return "Cliente";
  return role;
}

/** Converte URL de upload (/uploads/avatars/...) para URL servida pela API para a imagem carregar. */
function avatarDisplayUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/avatars/")) {
    return `/api/account/avatar/serve/${url.replace(/^\/uploads\/avatars\//, "")}`;
  }
  return url;
}

export default function AccountProfile({ user }: AccountProfileProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    if (activeTab === "tickets") fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const initials = useMemo(() => {
    return (
      (user.name || user.email)
        ?.split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  }, [user.name, user.email]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    setTicketsError(null);
    try {
      const res = await fetch("/api/account/tickets");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao obter bilhetes");
      setTickets(data.tickets ?? []);
    } catch (e: any) {
      setTicketsError(e?.message || "Erro ao obter bilhetes");
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingName) return;

    setSavingName(true);
    setToast(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar nome");

      setToast({ type: "success", message: "Perfil atualizado." });
      router.refresh();

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("daowave-session");
          bc.postMessage({ type: "session:update", name: name.trim() || null });
          bc.close();
        } catch {}
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

  const handleAvatarClick = () => fileInputRef.current?.click();

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

      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar foto de perfil");

      setAvatarUrl(data.avatarUrl ?? null);
      setToast({ type: "success", message: "Foto atualizada." });
      router.refresh();

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("daowave-session");
          bc.postMessage({ type: "session:update", avatarUrl: data.avatarUrl ?? null });
          bc.close();
        } catch {}
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao atualizar foto de perfil",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openTransfer = (t: TicketItem) => {
    setTransferingTicket(t);
    setTransferEmail("");
    setTransferLoading(false);
  };

  const closeTransfer = () => {
    setTransferingTicket(null);
    setTransferEmail("");
    setTransferLoading(false);
  };

  const submitTransfer = async () => {
    if (!transferingTicket || !transferEmail.trim()) {
      setToast({ type: "error", message: "Email do destinatário é obrigatório." });
      return;
    }
    setTransferLoading(true);

    try {
      const res = await fetch("/api/account/tickets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: transferingTicket.id,
          recipientEmail: transferEmail.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao transferir bilhete");

      setToast({ type: "success", message: "Bilhete transferido." });
      closeTransfer();
      fetchTickets();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Erro ao transferir bilhete" });
      setTransferLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[620px] w-[620px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Toast */}
        {toast && (
          <div
            className={cn(
              "mb-5 rounded-2xl border px-4 py-3 text-sm backdrop-blur-2xl",
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            )}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Conta</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white/92">Perfil e bilhetes</h1>
          <p className="mt-2 text-sm text-white/55">
            Gere identidade, preferências e transferências numa única área.
          </p>
        </div>

        {/* Shell Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.55)] overflow-hidden">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 px-5 sm:px-7 py-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAvatarClick}
                className={cn(
                  "relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden",
                  "border border-white/10 bg-white/5",
                  "flex items-center justify-center",
                  "text-sm font-semibold text-white/85",
                  "hover:bg-white/8 transition"
                )}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">{initials}</span>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[12px] text-white/80">
                    Upload…
                  </div>
                )}
              </button>

              <div className="min-w-0">
                <div className="text-xs text-white/45">Perfil</div>
                <div className="font-semibold text-white/92 truncate">{user.name || user.email}</div>
                <div className="text-xs text-white/55 truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70">
                {roleLabel(user.role)}
              </span>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Tabs */}
          <div className="px-5 sm:px-7 pt-5">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-semibold transition",
                  activeTab === "profile"
                    ? "bg-white text-black shadow-[0_18px_60px_rgba(0,0,0,.25)]"
                    : "text-white/70 hover:text-white"
                )}
              >
                Perfil
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-semibold transition",
                  activeTab === "tickets"
                    ? "bg-white text-black shadow-[0_18px_60px_rgba(0,0,0,.25)]"
                    : "text-white/70 hover:text-white"
                )}
              >
                Meus bilhetes
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-7 py-6">
            {activeTab === "profile" && (
              <form onSubmit={handleNameSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="O teu nome"
                      className={cn(
                        "w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
                        "px-4 py-3 text-sm text-white/90 placeholder:text-white/35",
                        "outline-none transition-all",
                        "focus:border-white/20 focus:bg-white/7 focus:ring-2 focus:ring-indigo-500/20"
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className={cn(
                        "w-full rounded-2xl border border-white/10 bg-white/3",
                        "px-4 py-3 text-sm text-white/55 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingName}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full",
                      "bg-gradient-to-r from-indigo-500 to-cyan-400",
                      "px-5 py-3 text-[13px] font-semibold text-black",
                      "shadow-[0_18px_60px_rgba(99,102,241,.25)]",
                      "transition-all hover:brightness-110 active:scale-[0.99]",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    {savingName ? "A guardar…" : "Guardar alterações"}
                  </button>
                </div>

                {/* Terminar sessão - definições do perfil */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-white/45 mb-3">Sessão</div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/", redirect: true })}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full",
                      "border border-white/20 bg-white/5 text-white/90",
                      "px-5 py-3 text-[13px] font-semibold",
                      "hover:bg-white/10 hover:text-white transition"
                    )}
                  >
                    Terminar sessão
                  </button>
                </div>
              </form>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-4">
                {loadingTickets && <div className="text-sm text-white/55">A carregar bilhetes…</div>}
                {ticketsError && <div className="text-sm text-red-200">{ticketsError}</div>}

                {!loadingTickets && tickets && tickets.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                    Ainda não tens bilhetes.
                  </div>
                )}

                <div className="space-y-3">
                  {tickets?.map((t) => {
                    const used = !!t.checkedInAt || (t.entriesUsed ?? 0) > 0;

                    return (
                      <div
                        key={t.id}
                        className={cn(
                          "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
                          "p-4 sm:p-5",
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-white/92 truncate">
                              {t.event?.title || "Evento"}
                            </div>

                            <span
                              className={cn(
                                "ml-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                used ? "bg-amber-500/15 text-amber-200 border border-amber-500/25" : "bg-emerald-500/12 text-emerald-200 border border-emerald-500/25"
                              )}
                            >
                              {used ? "Usado" : "Ativo"}
                            </span>

                            {t.ticketLot?.name && (
                              <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/65">
                                {t.ticketLot.name}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-xs text-white/55 space-y-1">
                            <div className="truncate">Código: <span className="text-white/75 font-mono">{t.code}</span></div>
                            <div>Compra: {formatDT(t.createdAt)}</div>
                            <div>Último check-in: {formatDT(t.lastCheckinAt || t.checkedInAt)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => openTransfer(t)}
                            className={cn(
                              "px-4 py-2.5 rounded-full text-[12px] font-semibold",
                              "border border-white/10 bg-white/5 text-white/80",
                              "hover:bg-white/8 hover:text-white transition"
                            )}
                          >
                            Transferir
                          </button>

                          <a
                            href={`/events/${t.event?.slug ?? t.event?.id}`}
                            className={cn(
                              "px-4 py-2.5 rounded-full text-[12px] font-semibold",
                              "bg-white text-black",
                              "hover:bg-zinc-100 transition"
                            )}
                          >
                            Ver evento
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer modal */}
      {transferingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTransfer} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/45 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.65)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/10">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Transferência</div>
              <h3 className="mt-2 text-lg font-semibold text-white/92">Transferir bilhete</h3>
              <p className="mt-2 text-sm text-white/55">
                {transferingTicket.code} — {transferingTicket.event?.title || "Evento"}
              </p>
            </div>

            <div className="px-6 py-5">
              <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                Email do destinatário
              </label>
              <input
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                type="email"
                placeholder="email@exemplo.com"
                className={cn(
                  "w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
                  "px-4 py-3 text-sm text-white/90 placeholder:text-white/35",
                  "outline-none transition-all",
                  "focus:border-white/20 focus:bg-white/7 focus:ring-2 focus:ring-indigo-500/20"
                )}
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTransfer}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-[12px] font-semibold",
                    "border border-white/10 bg-white/5 text-white/75 hover:text-white",
                    "hover:bg-white/8 transition"
                  )}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitTransfer}
                  disabled={transferLoading}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-[12px] font-semibold text-black",
                    "bg-gradient-to-r from-indigo-500 to-cyan-400",
                    "shadow-[0_18px_60px_rgba(99,102,241,.25)]",
                    "transition-all hover:brightness-110 active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {transferLoading ? "A processar…" : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}