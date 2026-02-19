import { prisma } from "../prisma";
import { MemberRole, OrganizationStatus } from "@prisma/client";

export class OrganizationService {
    /**
     * Create a new organization
     */
    static async create(data: {
        userId: string;
        name: string;
        slug: string;
        vatNumber?: string;
        contactEmail?: string;
    }) {
        return prisma.$transaction(async (tx) => {
            // Create Organization
            const org = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    vatNumber: data.vatNumber,
                    contactEmail: data.contactEmail,
                    status: OrganizationStatus.PENDING,
                },
            });

            // Add Creator as OWNER
            await tx.organizationMember.create({
                data: {
                    organizationId: org.id,
                    userId: data.userId,
                    role: MemberRole.OWNER,
                },
            });

            return org;
        });
    }

    /**
     * Get user's organizations
     */
    static async getUserOrganizations(userId: string) {
        return prisma.organization.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    where: { userId },
                    select: { role: true },
                },
            },
        });
    }

    /**
     * Get organization by ID/Slug (with permission check logic to be added in controller)
     */
    static async getById(orgId: string) {
        return prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                _count: {
                    select: { events: true, members: true },
                },
            },
        });
    }

    /**
     * Get Members
     */
    static async getMembers(orgId: string) {
        return prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
}
