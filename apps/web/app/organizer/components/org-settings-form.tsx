"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Hash,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

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

interface OrgSettingsFormProps {
  organization: Organization;
}

function Field({
  label,
  icon: Icon,
  children,
  hint,
  required,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-zinc-200">
        {Icon && <Icon className="h-4 w-4 text-zinc-400 shrink-0" />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all hover:border-zinc-600";

const EU_COUNTRIES = [
  "Portugal", "Espanha", "França", "Alemanha", "Itália", "Países Baixos",
  "Bélgica", "Suíça", "Áustria", "Polónia", "Reino Unido", "Irlanda",
  "Brasil", "Angola", "Moçambique", "Outro",
];

export default function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const [form, setForm] = useState({
    name: organization.name || "",
    legalName: organization.legalName || "",
    vatNumber: organization.vatNumber || "",
    contactEmail: organization.contactEmail || "",
    phone: organization.phone || "",
    address: organization.address || "",
    country: organization.country || "Portugal",
    website: organization.website || "",
    logoUrl: organization.logoUrl || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaved(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/organizer/organization", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.details) {
            const ze: Record<string, string> = {};
            data.details.forEach((err: any) => { ze[err.path[0]] = err.message; });
            setErrors(ze);
          } else {
            toast.error(data.error || "Erro ao guardar");
          }
          return;
        }

        setSaved(true);
        toast.success("Configurações guardadas com sucesso!");
        setTimeout(() => setSaved(false), 3000);
      } catch {
        toast.error("Erro de ligação. Tente de novo.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identity */}
      <section>
        <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-400" />
          Identidade da Organização
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome da Organização" icon={Building2} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="Ex: DãoWave Produções"
              required
            />
            {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{errors.name}</p>}
          </Field>

          <Field label="Razão Social" icon={FileText} hint="Nome legal completo para documentos fiscais">
            <input
              type="text"
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              className={inputClass}
              placeholder="Ex: DãoWave Produções, Lda."
            />
            {errors.legalName && <p className="text-red-400 text-xs mt-1">{errors.legalName}</p>}
          </Field>

          <Field label="NIF / NIPC" icon={Hash} hint="Número de Identificação Fiscal">
            <input
              type="text"
              value={form.vatNumber}
              onChange={(e) => set("vatNumber", e.target.value)}
              className={inputClass}
              placeholder="Ex: 510 123 456"
              maxLength={20}
            />
            {errors.vatNumber && <p className="text-red-400 text-xs mt-1">{errors.vatNumber}</p>}
          </Field>

          <Field label="Slug" hint="Identificador único (não editável)">
            <input
              type="text"
              value={organization.slug}
              className={`${inputClass} opacity-50 cursor-not-allowed`}
              disabled
            />
            <p className="text-xs text-zinc-500 mt-1.5">Para alterar o slug contacte o suporte.</p>
          </Field>
        </div>
      </section>

      {/* Contacts */}
      <section>
        <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-emerald-400" />
          Contactos
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email de Contacto" icon={Mail}>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className={inputClass}
              placeholder="geral@minha-organizacao.pt"
            />
            {errors.contactEmail && <p className="text-red-400 text-xs mt-1">{errors.contactEmail}</p>}
          </Field>

          <Field label="Telefone" icon={Phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="+351 900 000 000"
            />
          </Field>

          <Field label="Website" icon={Globe}>
            <input
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              className={inputClass}
              placeholder="https://minha-organizacao.pt"
            />
            {errors.website && <p className="text-red-400 text-xs mt-1">{errors.website}</p>}
          </Field>
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Localização
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Morada" icon={MapPin} hint="Sede da organização">
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Rua, nº, código postal, cidade"
            />
          </Field>

          <Field label="País">
            <select
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className={inputClass}
            >
              {EU_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Branding */}
      <section>
        <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-400" />
          Branding
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="URL do Logótipo" icon={ImageIcon} hint="Link direto para a imagem do logótipo (PNG/SVG recomendado)">
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              className={inputClass}
              placeholder="https://cdn.exemplo.com/logo.png"
            />
            {errors.logoUrl && <p className="text-red-400 text-xs mt-1">{errors.logoUrl}</p>}
          </Field>

          {form.logoUrl && (
            <div className="flex items-center justify-center">
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logoUrl}
                  alt="Pré-visualização do logótipo"
                  className="max-h-20 max-w-full object-contain rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Status badge */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          organization.status === "ACTIVE" ? "bg-emerald-400" :
          organization.status === "PENDING" ? "bg-amber-400" : "bg-zinc-500"
        }`} />
        <span className="text-sm text-zinc-400">
          Estado da organização:&nbsp;
          <span className="font-semibold text-zinc-200">
            {organization.status === "ACTIVE" ? "Ativa" :
             organization.status === "PENDING" ? "Pendente de aprovação" : organization.status}
          </span>
        </span>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />A guardar...</>
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" />Guardado!</>
          ) : (
            <><Save className="h-4 w-4" />Guardar Configurações</>
          )}
        </button>
      </div>
    </form>
  );
}
