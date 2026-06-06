"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { OrganizationCouponEditor } from "@/components/promoter/OrganizationCouponEditor";

export default function OrganizationCouponPage() {
  return (
    <PageShell
      title="Cupão de desconto"
      subtitle="Um cupão por organização — atribua a um evento para usar no checkout"
    >
      <OrganizationCouponEditor />
    </PageShell>
  );
}
