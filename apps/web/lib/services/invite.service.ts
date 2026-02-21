import { prisma } from "@/lib/prisma";
import { MemberRole, InviteStatus } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

export class InviteService {
    /**
     * Generate a secure random token (64 characters)
     */
    static generateRawToken(): string {
        return randomBytes(32).toString("hex");
    }

    /**
     * Hash a raw token for storage or lookup
     */
    static hashToken(rawToken: string): string {
        return createHash("sha256").update(rawToken).digest("hex");
    }

    /**
     * Create a new organization invitation
     */
    static async createInvite(params: {
        email: string;
        organizationId: string;
        role: MemberRole;
        expiresInHours?: number;
    }) {
        const rawToken = this.generateRawToken();
        const hashedToken = this.hashToken(rawToken);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (params.expiresInHours || 48));

        const invite = await prisma.invite.create({
            data: {
                token: hashedToken,
                email: params.email.toLowerCase().trim(),
                organizationId: params.organizationId,
                role: params.role,
                status: InviteStatus.PENDING,
                expiresAt,
            },
            include: { organization: true },
        });

        return {
            invite,
            rawToken, // This is returned to be sent via email/URL, never stored.
        };
    }

    /**
     * Validate a raw token and return the invite if valid
     */
    static async validateToken(rawToken: string) {
        const hashedToken = this.hashToken(rawToken);

        const invite = await prisma.invite.findUnique({
            where: { token: hashedToken },
            include: { organization: true },
        });

        if (!invite) return { valid: false, error: "Convite não encontrado." };

        if (invite.status !== InviteStatus.PENDING) {
            return { valid: false, error: "Este convite já foi utilizado ou cancelado." };
        }

        if (new Date() > invite.expiresAt) {
            // Mark as expired if encountered
            await prisma.invite.update({
                where: { id: invite.id },
                data: { status: InviteStatus.EXPIRED },
            });
            return { valid: false, error: "Este convite expirou." };
        }

        return { valid: true, invite };
    }

    /**
     * Mark an invite as accepted
     */
    static async acceptInvite(inviteId: string) {
        return prisma.invite.update({
            where: { id: inviteId },
            data: {
                status: InviteStatus.ACCEPTED,
                acceptedAt: new Date()
            },
        });
    }

    /**
     * Revoke/Cancel an invite
     */
    static async revokeInvite(inviteId: string) {
        return prisma.invite.update({
            where: { id: inviteId },
            data: { status: InviteStatus.REVOKED },
        });
    }
}
