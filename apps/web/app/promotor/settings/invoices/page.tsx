"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { InvoiceThemeEditor } from "@/components/promoter/InvoiceThemeEditor";

export default function OrganizationInvoicesPage() {
  return (
    <PageShell
      title="Design de Faturas"
      subtitle="Personalize o visual das faturas PDF enviadas aos clientes"
    >
      <InvoiceThemeEditor scope="organization" />
    </PageShell>
  );
}
