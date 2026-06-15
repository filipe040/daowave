import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageAdminOrganizations } from "@/lib/auth/admin-access";
import {
  OrgMemberRemovalError,
  removeOrganizationMember,
} from "@/lib/services/org-member.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const globalRole = (session?.user as { role?: string })?.role;
    const actorUserId = (session?.user as { id?: string })?.id;

    if (!session?.user || !actorUserId || !canManageAdminOrganizations(globalRole)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: organizationId, memberId } = await context.params;

    const result = await removeOrganizationMember({
      organizationId,
      memberId,
      actorUserId,
      actorMemberRole: null,
      isGlobalAdmin: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrgMemberRemovalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Admin Organization Team DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
