import { PromoterLayoutClient } from "@/components/promoter/PromoterLayoutClient";
import { requirePromoter } from "@/lib/auth/guards";

export default async function PromoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId } = await requirePromoter();

  // If we wanted to handle "No Org" at layout level:
  // if (!orgId) redirect("/promotor/onboarding");

  return <PromoterLayoutClient>{children}</PromoterLayoutClient>;
}
