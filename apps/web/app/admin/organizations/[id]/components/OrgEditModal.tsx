"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2, X, Building2 } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    legalName?: string | null;
    slug: string;
    vatNumber?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    address?: string | null;
    country?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    status: string;
}

interface OrgEditModalProps {
    org: Organization;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updated: Organization) => void;
}

const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 focus:bg-white/8 transition-colors";

const labelClass = "block text-[11px] font-bold text-white/40 uppercase tracking-[0.1em] mb-1.5";

const COUNTRIES = ["Portugal", "Espanha", "França", "Alemanha", "Itália", "Países Baixos", "Bélgica", "Suíça", "Áustria", "Polónia", "Reino Unido", "Brasil", "Angola", "Moçambique", "Outro"];

export function OrgEditModal({ org, isOpen, onClose, onSuccess }: OrgEditModalProps) {
    const [form, setForm] = useState({
        name: org.name || "",
        legalName: org.legalName || "",
        slug: org.slug || "",
        vatNumber: org.vatNumber || "",
        contactEmail: org.contactEmail || "",
        phone: org.phone || "",
        address: org.address || "",
        country: org.country || "Portugal",
        website: org.website || "",
        logoUrl: org.logoUrl || "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();

    const set = (key: string, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/admin/organizations/${org.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                const data = await res.json();

                if (!res.ok) {
                    if (data.details) {
                        const ze: Record<string, string> = {};
                        data.details.forEach((e: any) => { ze[e.path[0]] = e.message; });
                        setErrors(ze);
                    } else {
                        toast.error(data.error || "Erro ao guardar");
                    }
                    return;
                }

                toast.success("Organização atualizada com sucesso!");
                onSuccess(data);
                onClose();
            } catch {
                toast.error("Erro de ligação. Tente de novo.");
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0f11] border border-white/10 rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white/60" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-white">Editar Organização</h2>
                            <p className="text-[12px] text-white/40">@{org.slug}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="h-4 w-4 text-white/50" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-7 py-6 space-y-6">
                    {/* Identity */}
                    <div>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Identidade</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nome <span className="text-red-400">*</span></label>
                                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Nome da organização" required />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Razão Social</label>
                                <input type="text" value={form.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputClass} placeholder="Nome legal completo" />
                            </div>
                            <div>
                                <label className={labelClass}>NIF / NIPC</label>
                                <input type="text" value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} className={inputClass} placeholder="510 123 456" maxLength={20} />
                            </div>
                            <div>
                                <label className={labelClass}>Slug <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[14px] select-none">@</span>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                        className={`${inputClass} pl-8`}
                                        placeholder="minha-organizacao"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-white/30 mt-1">Apenas letras minúsculas, números e hífens.</p>
                                {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Contactos</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} placeholder="geral@org.pt" />
                                {errors.contactEmail && <p className="text-red-400 text-xs mt-1">{errors.contactEmail}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Telefone</label>
                                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="+351 900 000 000" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Website</label>
                                <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className={inputClass} placeholder="https://organizacao.pt" />
                                {errors.website && <p className="text-red-400 text-xs mt-1">{errors.website}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Localização</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Morada</label>
                                <textarea value={form.address} onChange={(e) => set("address", e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Rua, nº, código postal, cidade" />
                            </div>
                            <div>
                                <label className={labelClass}>País</label>
                                <select value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass}>
                                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>URL do Logótipo</label>
                                <input type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputClass} placeholder="https://cdn.org/logo.png" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending || !form.name.trim()}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />A guardar…</> : <><Save className="h-4 w-4" />Guardar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
