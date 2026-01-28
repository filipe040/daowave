"use client";

import { useState } from "react";

const ROLES = ["ADMIN", "ORGANIZER", "MANAGER", "STAFF", "VIEWER"] as const;
const PERMISSIONS = [
  { id: "CREATE_EVENTS", label: "Criar Eventos", subtitle: "NÍVEL DE ACESSO OPERACIONAL" },
  { id: "SELL_TICKETS", label: "Vender Bilhetes", subtitle: "NÍVEL DE ACESSO OPERACIONAL" },
  { id: "VALIDATE_ENTRIES", label: "Validar Entradas", subtitle: "NÍVEL DE ACESSO OPERACIONAL" },
  { id: "VIEW_REPORTS", label: "Ver Relatórios", subtitle: "NÍVEL DE ACESSO OPERACIONAL" },
  { id: "MANAGE_TEAMS", label: "Gerir Equipas", subtitle: "NÍVEL DE ACESSO OPERACIONAL" },
] as const;

// Matriz de permissões padrão por role
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS", "MANAGE_TEAMS"],
  ORGANIZER: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS", "MANAGE_TEAMS"],
  MANAGER: ["CREATE_EVENTS", "SELL_TICKETS", "VALIDATE_ENTRIES", "VIEW_REPORTS"],
  STAFF: ["SELL_TICKETS", "VALIDATE_ENTRIES"],
  VIEWER: ["VIEW_REPORTS"],
};

interface RBACMatrixProps {
  onClose: () => void;
}

export default function RBACMatrix({ onClose }: RBACMatrixProps) {
  const [permissions, setPermissions] = useState<Record<string, string[]>>(DEFAULT_PERMISSIONS);

  const hasPermission = (role: string, permission: string) => {
    return permissions[role]?.includes(permission) || false;
  };

  const togglePermission = (role: string, permission: string) => {
    setPermissions((prev) => {
      const rolePerms = prev[role] || [];
      if (rolePerms.includes(permission)) {
        return {
          ...prev,
          [role]: rolePerms.filter((p) => p !== permission),
        };
      } else {
        return {
          ...prev,
          [role]: [...rolePerms, permission],
        };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Matriz de Privilégios</h2>
              <p className="text-sm text-gray-600">Configure as permissões por função</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
              CONTROLO DE ACESSO RBAC
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                    FUNCIONALIDADE / PERMISSÃO
                  </th>
                  {ROLES.map((role) => (
                    <th
                      key={role}
                      className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr key={permission.id} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{permission.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{permission.subtitle}</div>
                      </div>
                    </td>
                    {ROLES.map((role) => (
                      <td key={role} className="py-4 px-4 text-center">
                        <button
                          onClick={() => togglePermission(role, permission.id)}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                            hasPermission(role, permission.id)
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {hasPermission(role, permission.id) ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                // RBAC Matrix is a reference view - permissions are set when creating/editing team members
                // This is just for visualization of default permissions per role
                onClose();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
