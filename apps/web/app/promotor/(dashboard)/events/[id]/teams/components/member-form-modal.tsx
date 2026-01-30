"use client";

import { useState, useEffect } from "react";

const ROLES = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "ORGANIZER", label: "ORGANIZER" },
  { value: "MANAGER", label: "MANAGER" },
  { value: "STAFF", label: "STAFF" },
  { value: "VIEWER", label: "VIEWER" },
] as const;

const PERMISSIONS = [
  { value: "CREATE_EVENTS", label: "Criar Eventos" },
  { value: "SELL_TICKETS", label: "Vender Bilhetes" },
  { value: "VALIDATE_ENTRIES", label: "Validar Entradas" },
  { value: "VIEW_REPORTS", label: "Ver Relatórios" },
  { value: "MANAGE_TEAMS", label: "Gerir Equipas" },
] as const;

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
  isVolunteer: boolean;
  notes: string | null;
  permissions: string[];
}

interface MemberFormModalProps {
  eventId: string;
  member: TeamMember | null;
  onClose: () => void;
}

export default function MemberFormModal({ eventId, member, onClose }: MemberFormModalProps) {
  const [email, setEmail] = useState(member?.userEmail || "");
  const [role, setRole] = useState(member?.role || "STAFF");
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [isVolunteer, setIsVolunteer] = useState(member?.isVolunteer ?? false);
  const [notes, setNotes] = useState(member?.notes || "");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(member?.permissions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-select permissions based on role
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS", "MANAGE_TEAMS"],
      ORGANIZER: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS", "MANAGE_TEAMS"],
      MANAGER: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS"],
      STAFF: ["SELL_TICKETS", "VALIDATE_ENTRIES"],
      VIEWER: ["VIEW_REPORTS"],
    };
    if (!member) {
      setSelectedPermissions(rolePermissions[role] || []);
    }
  }, [role, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = member
        ? `/api/promotor/events/${eventId}/teams/${member.id}`
        : `/api/promotor/events/${eventId}/teams`;
      const method = member ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          isActive,
          isVolunteer,
          notes: notes.trim() || null,
          permissions: selectedPermissions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao guardar");
      }

      onClose();
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {member ? "Editar Membro" : "Credenciar Novo Membro"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email do Utilizador *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!member}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            {member && (
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado após criação.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Função *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Membro Ativo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVolunteer}
                onChange={(e) => setIsVolunteer(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Voluntário</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              {PERMISSIONS.map((permission) => (
                <label key={permission.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.value)}
                    onChange={() => togglePermission(permission.value)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionais sobre este membro..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "A guardar..." : member ? "Guardar Alterações" : "Credenciar Membro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
