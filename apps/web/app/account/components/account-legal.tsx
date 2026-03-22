"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountLegal() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/account/legal/export", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", data.error ?? "Erro ao exportar");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "gopass-dados.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Dados exportados. O ficheiro foi descarregado.");
    } catch {
      showToast("error", "Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== "APAGAR CONTA") {
      showToast("error", "Escreve exatamente: APAGAR CONTA");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/legal/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "APAGAR CONTA" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error ?? "Erro ao apagar conta");
        return;
      }
      await signOut({ callbackUrl: "/", redirect: false });
      router.push("/");
      router.refresh();
    } catch {
      showToast("error", "Erro ao apagar conta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Termos e privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Exportar dados e apagar conta.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
        >
          {toast.message}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-background/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Exportar dados</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Descarrega uma cópia dos teus dados (perfil, encomendas, bilhetes) em JSON.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={handleExport}
          disabled={exporting}
          data-testid="legal-export"
        >
          {exporting ? "A exportar…" : "Exportar dados"}
        </Button>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Apagar conta</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta ação é irreversível. Todos os teus dados serão eliminados.
        </p>
        <form onSubmit={handleDelete} className="mt-4 max-w-md space-y-4">
          <div>
            <Label htmlFor="delete-confirm">
              Escreve <strong>APAGAR CONTA</strong> para confirmar
            </Label>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="APAGAR CONTA"
              className="mt-2 border-zinc-700 bg-zinc-950"
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="destructive"
            disabled={deleting || deleteConfirm !== "APAGAR CONTA"}
            data-testid="legal-delete-account"
          >
            {deleting ? "A apagar…" : "Apagar conta"}
          </Button>
        </form>
      </section>
    </div>
  );
}
