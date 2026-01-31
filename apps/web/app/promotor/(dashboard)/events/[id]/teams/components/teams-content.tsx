"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, TrendingUp, Heart, BarChart3, Shield, FileText, PlusCircle, Clock, ChevronRight } from "lucide-react";
import PromoterSidebar from "../../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";
import RBACMatrix from "./rbac-matrix";
import MemberFormModal from "./member-form-modal";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  VIEWER: "VIEWER",
};

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
  isVolunteer: boolean;
  notes: string | null;
  createdAt: Date | string;
  lastAccessAt: Date | string | null;
  permissions: string[];
}

interface Stats {
  totalMembers: number;
  activeStaff: number;
  volunteers: number;
  recentAccesses: number;
}

interface TeamsContentProps {
  event: Event;
  teamMembers: TeamMember[];
  stats: Stats;
}

export default function TeamsContent({ event, teamMembers, stats }: TeamsContentProps) {
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showRBACMatrix, setShowRBACMatrix] = useState(false);

  const handleAddMember = () => {
    setSelectedMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberForm(true);
  };

  const handleCloseForm = () => {
    setShowMemberForm(false);
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={event.id} />

      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${event.id}` },
              { label: "EQUIPAS", active: true },
            ]}
          />

          {/* Header */}
          <div className="mb-6 mt-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 border-2 border-white/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <span className="text-xs text-white/70 uppercase">HCM</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase mb-1">
                  Gestão de <span className="text-[#60a5fa]">Equipas.</span>
                </h1>
                <p className="text-sm text-white/70">
                  Controlo centralizado de staff, voluntários e operações de campo. Configure permissões granulares e escalas de trabalho em tempo real.
                </p>
              </div>
              <button
                onClick={handleAddMember}
                className="bg-[#60a5fa] hover:bg-[#3b82f6] text-white px-4 py-2.5 rounded-lg font-semibold text-xs uppercase transition-colors whitespace-nowrap"
              >
                CREDENCIAR NOVO MEMBRO
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-7 w-7 text-gray-600" strokeWidth={1.5} />
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span>+0</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
              <div className="text-xs text-gray-500 uppercase">Membros Totais</div>
              <div className="text-[10px] text-gray-400 mt-1">DIFERENCIAL VS ONTEM</div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-7 w-7 text-gray-600" strokeWidth={1.5} />
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span>+0</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeStaff}</div>
              <div className="text-xs text-gray-500 uppercase">Staff Ativo</div>
              <div className="text-[10px] text-gray-400 mt-1">DIFERENCIAL VS ONTEM</div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-7 w-7 text-gray-600" strokeWidth={1.5} />
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span>+0</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.volunteers}</div>
              <div className="text-xs text-gray-500 uppercase">Voluntários</div>
              <div className="text-[10px] text-gray-400 mt-1">DIFERENCIAL VS ONTEM</div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-7 w-7 text-gray-600" strokeWidth={1.5} />
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span>+0</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.recentAccesses}</div>
              <div className="text-xs text-gray-500 uppercase">Acessos Recentes</div>
              <div className="text-[10px] text-gray-400 mt-1">DIFERENCIAL VS ONTEM</div>
            </div>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Estrutura de Equipas */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Users className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Estrutura de Equipas</h3>
              <p className="text-xs text-gray-600">Defina a hierarquia de líderes e subdivisões operacionais.</p>
            </div>

            {/* Membros de Staff */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowRBACMatrix(true)}>
              <div className="flex items-start justify-between mb-3">
                <Shield className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Membros de Staff</h3>
              <p className="text-xs text-gray-600">Gestão de credenciais, funções e permissões de acesso.</p>
            </div>

            {/* Corpo de Voluntários */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Heart className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Corpo de Voluntários</h3>
              <p className="text-xs text-gray-600">Coordenação de voluntariado e atribuição de tarefas.</p>
            </div>

            {/* Escala de Turnos */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Clock className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Escala de Turnos</h3>
              <p className="text-xs text-gray-600">Planeamento horário e controlo de lotação por sector.</p>
            </div>

            {/* Formulários de Recrutamento */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <FileText className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Formulários de Recrutamento</h3>
              <p className="text-xs text-gray-600">Criação de fluxos de candidatura personalizados.</p>
            </div>

            {/* Fluxo de Candidaturas */}
            <div className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <PlusCircle className="h-8 w-8 text-gray-600" strokeWidth={1.5} />
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Fluxo de Candidaturas</h3>
              <p className="text-xs text-gray-600">Triagem, entrevista e aprovação de novos membros.</p>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-white rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Membros da Equipa</h2>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">Ainda não há membros na equipa.</p>
                <button
                  onClick={handleAddMember}
                  className="text-[#60a5fa] hover:underline text-sm"
                >
                  Adicionar primeiro membro
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Nome</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Função</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 text-sm text-gray-900">{member.userName}</td>
                        <td className="py-3 px-3 text-sm text-gray-600">{member.userEmail}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {member.isVolunteer ? "Voluntário" : "Staff"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            member.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {member.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-[#60a5fa] hover:text-[#3b82f6] text-sm"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RBAC Matrix Modal */}
      {showRBACMatrix && (
        <RBACMatrix onClose={() => setShowRBACMatrix(false)} />
      )}

      {/* Member Form Modal */}
      {showMemberForm && (
        <MemberFormModal
          eventId={event.id}
          member={selectedMember}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
