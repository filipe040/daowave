"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { Building2, Plus, Users, Calendar, ArrowRight, X, Loader2, AlertCircle } from "lucide-react";
import { getAdminOrganizations, Organization } from "@/lib/api-client";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ORG_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVE: { label: "Ativa", color: "text-emerald-600 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400" },
    PENDING: { label: "Pendente", color: "text-amber-600 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
    REJECTED: { label: "Rejeitada", color: "text-rose-400 bg-rose-400/10 border-rose-400/20", dot: "bg-rose-400" },
    SUSPENDED: { label: "Suspensa", color: "text-zinc-400 bg-neutral-100 border-white/10", dot: "bg-neutral-400" },
};

// ─── Create Organization Modal ───────────────────────────────────────────────

interface CreateOrgModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function CreateOrgModal({ open, onClose, onCreated }: CreateOrgModalProps) {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        legalName: "",
        vatNumber: "",
        contactEmail: "",
        status: "PENDING",
    });
    const [slugManual, setSlugManual] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    // Auto-generate slug from name unless user has manually edited it
    useEffect(() => {
        if (!slugManual) {
            setForm((f) => ({ ...f, slug: slugify(f.name) }));
        }
    }, [form.name, slugManual]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        if (name === "slug") setSlugManual(true);
        setForm((f) => ({ ...f, [name]: value }));
        setFieldError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) { setFieldError("O nome é obrigatório."); return; }
        if (!form.slug.trim()) { setFieldError("O slug é obrigatório."); return; }
        if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
            setFieldError("Email inválido."); return;
        }

        setSubmitting(true);
        setFieldError(null);
        try {
            const { data, error } = await api.post<any>("/api/admin/organizations", {
                name: form.name.trim(),
                slug: form.slug.trim(),
                legalName: form.legalName.trim() || undefined,
                vatNumber: form.vatNumber.trim() || undefined,
                contactEmail: form.contactEmail.trim() || undefined,
                status: form.status,
            });

            if (error) {
                setFieldError(error);
            } else {
                toast.success(`Organização "${form.name}" criada com sucesso!`);
                onCreated();
                onClose();
                // Reset form
                setForm({ name: "", slug: "", legalName: "", vatNumber: "", contactEmail: "", status: "PENDING" });
                setSlugManual(false);
            }
        } catch {
            setFieldError("Falha na comunicação com o servidor.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />

            {/* Panel */}
            <div className="relative w-full max-w-lg bg-[#0c0c12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Nova Organização</h2>
                        <p className="text-sm text-zinc-500 mt-0.5">Criar uma entidade promotora na plataforma</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="public-label mb-2">
                            Nome <span className="text-rose-400">*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ex: DaoWave Eventos"
                            className="public-input h-11 rounded-xl"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="public-label mb-2">
                            Slug <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono select-none">
                                /
                            </span>
                            <input
                                name="slug"
                                value={form.slug}
                                onChange={handleChange}
                                placeholder="daowave-eventos"
                                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm pl-7 pr-4 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 transition-all font-mono"
                            />
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
                            Apenas letras minúsculas, números e hífens
                        </p>
                    </div>

                    {/* Legal Name + VAT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="public-label mb-2">
                                Nome Legal
                            </label>
                            <input
                                name="legalName"
                                value={form.legalName}
                                onChange={handleChange}
                                placeholder="Razão Social"
                                className="public-input h-11 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="public-label mb-2">
                                NIF / VAT
                            </label>
                            <input
                                name="vatNumber"
                                value={form.vatNumber}
                                onChange={handleChange}
                                placeholder="PT123456789"
                                className="public-input h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Contact Email */}
                    <div>
                        <label className="public-label mb-2">
                            Email de Contacto
                        </label>
                        <input
                            name="contactEmail"
                            type="email"
                            value={form.contactEmail}
                            onChange={handleChange}
                            placeholder="geral@organizacao.pt"
                            className="public-input h-11 rounded-xl"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="public-label mb-2">
                            Estado Inicial
                        </label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-4 focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="PENDING">Pendente</option>
                            <option value="ACTIVE">Ativa</option>
                        </select>
                    </div>

                    {/* Error */}
                    {fieldError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {fieldError}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 pb-8">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-bold transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form=""
                        disabled={submitting || !form.name.trim() || !form.slug.trim()}
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 h-11 rounded-2xl bg-[#14141f] text-black text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xl shadow-white/5"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                        )}
                        {submitting ? "A criar..." : "Criar Organização"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminOrganizationsPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<Organization[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        const qStatus = searchParams.get("status");
        if (qStatus && ["PENDING", "ACTIVE", "SUSPENDED"].includes(qStatus)) {
            setStatus(qStatus);
        }
    }, [searchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAdminOrganizations({
                page,
                limit: 10,
                ...(status !== "ALL" && { status }),
                q: search,
            });

            if (result.error || !result.data) {
                setError(result.error ?? "Erro ao carregar organizações");
            } else {
                setData(result.data.organizations ?? []);
                setTotal(result.data.pagination.total);
            }
        } catch (err) {
            setError("Falha na comunicação com o servidor");
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 300);
        return () => clearTimeout(timer);
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / 10));

    return (
        <>
            <CreateOrgModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={load}
            />

            <PageShell
                title="Organizações"
                subtitle={`${total} entidade${total !== 1 ? "s" : ""} gerida${total !== 1 ? "s" : ""}`}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <select
                                className="appearance-none text-[13px] font-bold border border-white/10 bg-white/5 text-zinc-400 rounded-2xl px-4 pr-10 h-11 focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 hover:bg-white/10 transition-all cursor-pointer shadow-xl"
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">Todos os Estados</option>
                                <option value="PENDING">Pendentes</option>
                                <option value="ACTIVE">Ativas</option>
                                <option value="REJECTED">Rejeitadas</option>
                                <option value="SUSPENDED">Suspensas</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-500 transition-colors">
                                <ArrowRight className="h-3 w-3 rotate-90" />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-5 h-11 bg-[#14141f] text-black rounded-2xl text-[13px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Nova Organização
                        </button>
                    </div>
                }
            >
                <DataTable<Organization>
                    keyField="id"
                    data={data}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={Building2}
                    emptyTitle="Sem organizações"
                    emptyDescription="A sua pesquisa não devolveu resultados."
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    columns={[
                        {
                            key: "name",
                            label: "Organização",
                            render: (org) => (
                                <Link href={`/admin/organizations/${org.id}`} className="group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-neutral-300 transition-all">
                                            <Building2 className="h-5 w-5 text-zinc-500 group-hover/item:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white group-hover/item:text-[#5ec8f8] transition-colors tracking-tight">
                                                {org.name}
                                            </div>
                                            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                                                {org.slug}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ),
                        },
                        {
                            key: "status",
                            label: "Estado",
                            render: (org) => {
                                const config = ORG_STATUS_CONFIG[org.status] || ORG_STATUS_CONFIG.SUSPENDED;
                                return (
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm",
                                        config.color
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                        {config.label}
                                    </div>
                                );
                            },
                        },
                        {
                            key: "members",
                            label: "Equipa",
                            render: (org) => (
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Users className="h-4 w-4" />
                                    <span className="text-[13px] font-medium">{org._count?.members || 0}</span>
                                </div>
                            ),
                        },
                        {
                            key: "events",
                            label: "Eventos",
                            render: (org) => (
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-[13px] font-medium">{org._count?.events || 0}</span>
                                </div>
                            ),
                        },
                        {
                            key: "createdAt",
                            label: "Criada",
                            render: (org) => (
                                <span className="text-[13px] font-medium text-zinc-500">
                                    {new Date(org.createdAt).toLocaleDateString("pt-PT")}
                                </span>
                            ),
                        },
                    ]}
                    rowActions={(org) => (
                        <Link
                            href={`/admin/organizations/${org.id}`}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-zinc-500 hover:bg-[#14141f] hover:text-black transition-all group/action"
                        >
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/action:translate-x-0.5" strokeWidth={2.5} />
                        </Link>
                    )}
                />
            </PageShell>
        </>
    );
}
