"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import * as Skeletons from "@/components/dashboard/LoadingSkeletons";
import { ErrorState } from "@/components/dashboard/ErrorState";
import {
    Building2,
    Users,
    Mail,
    ShieldCheck,
    Calendar,
    ExternalLink,
    Settings,
    Activity,
    ArrowLeft,
    Plus,
    Trash2
} from "lucide-react";
import { api, Organization } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

import { TeamTab } from "./components/TeamTab";
import { InvitesTab } from "./components/InvitesTab";
import { AuditTab } from "./components/AuditTab";
import { FinancialTab } from "./components/FinancialTab";
import { InviteModal } from "./components/InviteModal";
import { OrgEditModal } from "./components/OrgEditModal";
import { DeleteOrgModal } from "./components/DeleteOrgModal";

type TabType = "overview" | "team" | "invites" | "audit" | "financial";

const TABS: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Visão Geral", icon: Building2 },
    { id: "financial", label: "Config. Financeira", icon: Settings },
    { id: "team", label: "Equipa", icon: Users },
    { id: "invites", label: "Convites", icon: Mail },
    { id: "audit", label: "Auditoria", icon: ShieldCheck },
];

export default function OrganizationDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: apiError } = await api.get<Organization>(`/api/admin/organizations/${id}`);
            if (apiError) setError(apiError);
            else setOrg(data);
        } catch (err) {
            setError("Falha ao carregar detalhes da organização");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <PageShell title="..."><Skeletons.StatsSkeleton /></PageShell>;
    if (error || !org) return <PageShell title="Erro"><ErrorState message={error || "Não encontrado"} onRetry={load} /></PageShell>;

    return (
        <PageShell
            title={org.name}
            subtitle={org.legalName || "Detalhes da organização"}
            backButton={{
                href: "/admin/organizations",
                label: "Voltar para lista"
            }}
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-[13px] font-bold transition-all border border-red-500/20"
                    >
                        <Trash2 className="h-4 w-4" />
                        Apagar
                    </button>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-4 h-10 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl text-[13px] font-bold transition-all border border-neutral-200"
                    >
                        <Settings className="h-4 w-4 text-neutral-500" />
                        Configurações
                    </button>
                    {org.website && (
                        <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 h-10 bg-white text-black rounded-xl text-[13px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Website
                        </a>
                    )}
                </div>
            }
        >
            {showDeleteModal && (
                <DeleteOrgModal
                    org={org}
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onDeleted={() => router.push("/admin/organizations")}
                />
            )}
            {showEditModal && (
                <OrgEditModal
                    org={org}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={(updated) => setOrg({ ...org, ...updated } as Organization)}
                />
            )}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                organizationId={org.id}
                onSuccess={() => {
                    load();
                    if (activeTab !== 'invites') setActiveTab('invites');
                }}
            />

            {/* Header Tabs */}
            <div className="flex items-center gap-1 p-1 bg-neutral-50 rounded-2xl border border-neutral-200 mb-8 w-fit">
                {TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300",
                                active
                                    ? "bg-white text-black shadow-xl"
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4", active ? "text-white" : "text-neutral-500")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary Card */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white border border-neutral-200 shadow-sm rounded-[32px] p-8">
                                <h3 className="text-xl font-bold text-neutral-900 tracking-tight mb-6">Informação Legal</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                                    <div>
                                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1.5">Nome Legal</div>
                                        <div className="text-[15px] font-bold text-neutral-900 tracking-tight">{org.legalName || "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1.5">NIF / VAT</div>
                                        <div className="text-[15px] font-bold text-neutral-900 tracking-tight">{org.vatNumber || "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1.5">Slug</div>
                                        <div className="text-[15px] font-medium text-amber-600 tracking-tight">@{org.slug}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1.5">Membro desde</div>
                                        <div className="text-[15px] font-bold text-neutral-900 tracking-tight">{new Date(org.createdAt).toLocaleDateString("pt-PT")}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-neutral-50 rounded-[24px] p-6 border border-neutral-200">
                                    <div className="text-neutral-400 mb-2"><Activity className="h-5 w-5" /></div>
                                    <div className="text-2xl font-black text-neutral-900">{org._count?.events || 0}</div>
                                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Eventos</div>
                                </div>
                                <div className="bg-neutral-50 rounded-[24px] p-6 border border-neutral-200">
                                    <div className="text-neutral-400 mb-2"><Users className="h-5 w-5" /></div>
                                    <div className="text-2xl font-black text-neutral-900">{org._count?.members || 0}</div>
                                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Membros</div>
                                </div>
                                <div className="bg-neutral-50 rounded-[24px] p-6 border border-neutral-200">
                                    <div className="text-neutral-400 mb-2"><Mail className="h-5 w-5" /></div>
                                    <div className="text-2xl font-black text-neutral-900">{org._count?.invites || 0}</div>
                                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Convites</div>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="space-y-6">
                            <div className="border border-neutral-200 bg-neutral-50 rounded-[32px] p-8">
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Estado da Entidade</h3>
                                <div className="flex flex-col gap-4">
                                    {/* Simple Status Badge for now */}
                                    <div className="flex items-center gap-3 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        <span className="text-emerald-600 font-bold text-[13px] uppercase tracking-widest">{org.status}</span>
                                    </div>
                                    <p className="text-[13px] text-neutral-500 leading-relaxed">
                                        Esta organização está ativa e tem permissões completas para criar eventos e gerir vendas na plataforma.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "financial" && <FinancialTab organizationId={id} />}

                {activeTab === "team" && <TeamTab organizationId={id} />}

                {activeTab === "invites" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Convites Pendentes</h3>
                                <p className="text-sm text-neutral-500 mt-1">Gira os convites enviados para novos membros.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 px-5 h-11 bg-white text-black rounded-2xl text-[13px] font-bold hover:scale-[1.02] transition-all shadow-xl shadow-white/5"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                Convidar Membro
                            </button>
                        </div>
                        <InvitesTab organizationId={id} />
                    </div>
                )}

                {activeTab === "audit" && <AuditTab organizationId={id} />}
            </div>
        </PageShell>
    );
}
