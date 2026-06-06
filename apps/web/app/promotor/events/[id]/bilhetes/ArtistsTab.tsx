"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Plus, Check, Loader2, Pencil, X, Trash2, Mic2, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArtistsApiPanel } from "./ArtistsApiPanel";

interface Artist {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    bio: string | null;
    performanceAt: string;
    venue: string | null;
    locationUrl: string | null;
    sortOrder: number;
    badgeLabel: string | null;
    isPublished: boolean;
    ticketType: {
        ticketLots: Array<{
            id: string;
            name: string;
            priceCents: number;
            capacity: number;
            soldCount: number;
        }>;
    };
}

function slugify(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const EMPTY_FORM = {
    name: "",
    slug: "",
    slugManual: false,
    imageUrl: "",
    bio: "",
    performanceAt: "",
    venue: "",
    locationUrl: "",
    badgeLabel: "",
    priceCents: "",
    capacity: "100",
    lotName: "Bilhete Normal",
};

export default function ArtistsTab({
    eventId,
    eventSlug,
    layoutMode = "STANDARD",
    onLayoutModeChange,
}: {
    eventId: string;
    eventSlug?: string;
    layoutMode?: string;
    onLayoutModeChange?: (mode: string) => void;
}) {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/artists`, undefined, 8000);
            if (!res.ok) throw new Error("Erro ao carregar artistas");
            const data = await res.json();
            setArtists(data.artists);
            setCanEdit(!!data.meta?.canEdit);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro";
            setError(
                msg.includes("carregar")
                    ? "Não foi possível carregar artistas. Se acabou de atualizar a plataforma, peça ao administrador para correr as migrations da base de dados."
                    : msg
            );
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!formData.slugManual && formData.name) {
            setFormData((f) => ({ ...f, slug: slugify(f.name) }));
        }
    }, [formData.name, formData.slugManual]);

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const startEdit = (artist: Artist) => {
        const lot = artist.ticketType.ticketLots[0];
        setEditingId(artist.id);
        setFormData({
            name: artist.name,
            slug: artist.slug,
            slugManual: true,
            imageUrl: artist.imageUrl || "",
            bio: artist.bio || "",
            performanceAt: new Date(artist.performanceAt).toISOString().slice(0, 16),
            venue: artist.venue || "",
            locationUrl: artist.locationUrl || "",
            badgeLabel: artist.badgeLabel || "",
            priceCents: lot ? String(lot.priceCents / 100) : "",
            capacity: lot ? String(lot.capacity || 100) : "100",
            lotName: lot?.name || "Bilhete Normal",
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const price = Math.round(parseFloat(formData.priceCents.replace(",", ".")) * 100);
            const capacity = parseInt(formData.capacity, 10);
            if (isNaN(price) || price < 0) throw new Error("Preço inválido");
            if (isNaN(capacity) || capacity < 1) throw new Error("Capacidade inválida");

            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                imageUrl: formData.imageUrl.trim() || undefined,
                bio: formData.bio.trim() || undefined,
                performanceAt: new Date(formData.performanceAt).toISOString(),
                venue: formData.venue.trim() || undefined,
                locationUrl: formData.locationUrl.trim() || undefined,
                badgeLabel: formData.badgeLabel.trim() || undefined,
                priceCents: price,
                capacity,
                lotName: formData.lotName.trim() || "Bilhete Normal",
            };

            const url = editingId
                ? `/api/promotor/events/${eventId}/artists/${editingId}`
                : `/api/promotor/events/${eventId}/artists`;
            const res = await fetchWithTimeout(url, {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }, 10000);

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao guardar");
            }

            toast.success(editingId ? "Artista atualizado" : "Artista criado");
            if (layoutMode !== "ARTISTS") {
                onLayoutModeChange?.("ARTISTS");
            }
            resetForm();
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (artist: Artist) => {
        const sold = artist.ticketType.ticketLots.reduce((s, l) => s + (l.soldCount ?? 0), 0);
        if (sold > 0) {
            toast.error("Não é possível apagar um artista com bilhetes vendidos.");
            return;
        }
        if (!confirm(`Apagar "${artist.name}"? Esta ação não pode ser desfeita.`)) return;

        setDeletingId(artist.id);
        try {
            const res = await fetchWithTimeout(
                `/api/promotor/events/${eventId}/artists/${artist.id}`,
                { method: "DELETE" },
                8000
            );
            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao apagar");
            }
            toast.success("Artista apagado");
            if (editingId === artist.id) resetForm();
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div className="p-12 text-center text-red-500 font-medium">{error}</div>;
    }

    return (
        <div className="p-6 sm:p-8">
            {layoutMode !== "ARTISTS" && (
                <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 sm:p-5">
                    <p className="text-[14px] font-bold text-violet-200">Modo bilhetes por artista</p>
                    <p className="text-[13px] text-violet-200/70 mt-1 leading-relaxed">
                        Adicione artistas abaixo — ao criar o primeiro, a página pública passa automaticamente para o layout em grelha (estilo festival).
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Mic2 className="h-5 w-5 text-white/50" />
                        Artistas
                    </h3>
                    <p className="text-sm text-white/40 mt-1">
                        Cada artista tem a sua página pública com poster e bilhetes.
                    </p>
                    {eventSlug && (
                        <Link
                            href={`/events/${eventSlug}/artistas`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-400 hover:text-amber-300 mt-2"
                        >
                            Ver página pública
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    )}
                </div>
                {canEdit && !isFormOpen && (
                    <button
                        type="button"
                        onClick={() => { resetForm(); setIsFormOpen(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-white text-black hover:bg-white/90 transition-all shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar Artista
                    </button>
                )}
                {!canEdit && (
                    <p className="text-[12px] text-amber-400/80 font-medium max-w-xs text-right">
                        Apenas proprietários ou gestores da organização podem adicionar artistas.
                    </p>
                )}
            </div>

            {isFormOpen && canEdit && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-2xl bg-black/30 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">{editingId ? "Editar Artista" : "Novo Artista"}</h4>
                        <button type="button" onClick={resetForm} className="text-white/40 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Nome *</label>
                            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" placeholder="Fernando Daniel" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Slug *</label>
                            <input required pattern="[a-z0-9-]+" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value, slugManual: true })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm font-mono" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">URL da imagem (poster)</label>
                            <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Data do concerto *</label>
                            <input required type="datetime-local" value={formData.performanceAt} onChange={(e) => setFormData({ ...formData, performanceAt: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Nome do local (opcional)</label>
                            <input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" placeholder="Usa o do evento se vazio" />
                        </div>
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Link do mapa (Google Maps)</label>
                                <a
                                    href="https://www.google.com/maps"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300"
                                >
                                    <MapPin className="h-3 w-3" />
                                    Abrir Maps
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                            <input
                                type="url"
                                value={formData.locationUrl}
                                onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                                className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm"
                                placeholder="https://maps.google.com/... — substitui o mapa do evento para este artista"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Preço (€) *</label>
                            <input required value={formData.priceCents} onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" placeholder="10.00" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Capacidade *</label>
                            <input required type="number" min={1} value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Etiqueta (ex: 1º Lote)</label>
                            <input value={formData.badgeLabel} onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Nome do bilhete</label>
                            <input value={formData.lotName} onChange={(e) => setFormData({ ...formData, lotName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/50 text-white px-4 py-2.5 text-sm" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-[13px] font-bold text-white/50 hover:text-white">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-white text-black disabled:opacity-40">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {editingId ? "Guardar" : "Criar Artista"}
                        </button>
                    </div>
                </form>
            )}

            {artists.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                    <Mic2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Ainda não há artistas configurados.</p>
                    {canEdit && <p className="text-sm mt-1">Adicione o primeiro artista para ativar a página pública.</p>}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {artists.map((artist) => {
                        const lot = artist.ticketType.ticketLots[0];
                        const isEditing = editingId === artist.id;
                        return (
                            <div key={artist.id} className={`rounded-2xl border p-4 ${isEditing ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-white/[0.02]"}`}>
                                <div className="flex gap-4">
                                    {artist.imageUrl ? (
                                        <img src={artist.imageUrl} alt="" className="w-16 h-20 rounded-lg object-cover shrink-0 bg-white/5" />
                                    ) : (
                                        <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-violet-500/30 to-orange-500/30 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-white truncate">{artist.name}</h4>
                                        <p className="text-[12px] text-white/40 font-mono">/{artist.slug}</p>
                                        {lot && (
                                            <p className="text-[13px] text-white/60 mt-1">
                                                {formatCurrency(lot.priceCents)} · {lot.soldCount}/{lot.capacity} vendidos
                                            </p>
                                        )}
                                        {artist.badgeLabel && (
                                            <span className="inline-block mt-1 text-[10px] font-bold uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{artist.badgeLabel}</span>
                                        )}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2 mt-4 justify-end">
                                        <button type="button" onClick={() => isEditing ? resetForm() : startEdit(artist)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-white/70 hover:bg-white/5">
                                            {isEditing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                                            {isEditing ? "Fechar" : "Editar"}
                                        </button>
                                        <button type="button" onClick={() => handleDelete(artist)} disabled={deletingId === artist.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                                            {deletingId === artist.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            Apagar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {eventSlug && <ArtistsApiPanel eventSlug={eventSlug} />}
        </div>
    );
}
