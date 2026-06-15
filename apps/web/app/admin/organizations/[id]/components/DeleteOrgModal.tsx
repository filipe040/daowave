"use client";

import { useState } from "react";
import { Loader2, Trash2, X, AlertTriangle } from "lucide-react";
import { api, Organization } from "@/lib/api-client";
import { toast } from "sonner";

interface DeleteOrgModalProps {
    org: Organization;
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

export function DeleteOrgModal({ org, isOpen, onClose, onDeleted }: DeleteOrgModalProps) {
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const eventCount = org._count?.events ?? 0;
    const canConfirm = confirmName.trim() === org.name.trim();

    const handleDelete = async () => {
        if (!canConfirm) return;

        setIsDeleting(true);
        try {
            const { error } = await api.delete<{ success: boolean }>(
                `/api/admin/organizations/${org.id}`
            );
            if (error) throw new Error(error);
            toast.success("Organização apagada");
            onDeleted();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao apagar organização");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (isDeleting) return;
        setConfirmName("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#14141f] border border-red-200 rounded-[28px] p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Apagar organização</h2>
                            <p className="text-sm text-zinc-500 mt-0.5">Esta ação é permanente e irreversível.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                        Serão apagados todos os dados de <span className="text-white font-bold">{org.name}</span>,
                        incluindo {eventCount} evento(s), encomendas, bilhetes, membros e convites.
                    </p>
                    <p className="text-[13px] text-zinc-400">
                        Para confirmar, escreva o nome da organização:{" "}
                        <span className="text-white font-bold">{org.name}</span>
                    </p>
                    <input
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={org.name}
                        disabled={isDeleting}
                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] placeholder:text-zinc-500 focus:outline-none focus:border-red-400 disabled:opacity-50"
                    />
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="px-5 h-11 rounded-xl text-[13px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={!canConfirm || isDeleting}
                        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-[13px] font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Apagar organização
                    </button>
                </div>
            </div>
        </div>
    );
}
