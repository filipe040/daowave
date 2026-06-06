"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { OrganizationCouponEditor } from "@/components/promoter/OrganizationCouponEditor";

export default function OrganizationCouponPage() {
  return (
    <PageShell
      title="Cupão de desconto"
      subtitle="Crie cupões para vários promotores — cada código gera comissão em €"
    >
      <OrganizationCouponEditor />
    </PageShell>
  );
}
