import { MemberRole } from "@prisma/client";
import { PromoterLayoutClient } from "@/components/promoter/PromoterLayoutClient";
import { requirePromoter } from "@/lib/auth/guards";

export default async function PromoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId, role } = await requirePromoter();

  return (
    <PromoterLayoutClient memberRole={role ?? MemberRole.PROMOTER_CHECKIN}>
      {children}
    </PromoterLayoutClient>
  );
}
