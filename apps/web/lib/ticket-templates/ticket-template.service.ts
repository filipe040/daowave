import { prisma } from "@/lib/prisma";
import { ThemeJson, themeJsonSchema, TicketTemplateStatus, TicketTemplateLayout } from "./models";
import { createAuditLog } from "@/lib/security";

export const TicketTemplateService = {
    /**
     * List templates for an organization
     */
    async listByOrg(organizationId: string) {
        return prisma.organizationTicketTemplate.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Get template by ID
     */
    async getById(id: string) {
        return prisma.organizationTicketTemplate.findUnique({
            where: { id },
        });
    },

    /**
     * Create a DRAFT template with default values
     */
    async createDraft(organizationId: string, name: string, layout: TicketTemplateLayout = TicketTemplateLayout.A4_CLASSIC) {
        const defaultTheme: ThemeJson = {
            brand: { logoUrl: "", tagline: "" },
            colors: {
                bg: "#ffffff",
                card: "#ffffff",
                text: "#111111",
                primary: "#19c37d",
                muted: "#666666",
            },
            typography: { fontFamily: "Inter" },
            qr: { size: "M", label: "Validar na entrada" },
            blocks: {
                showBuyerName: true,
                showOrderId: true,
                showTicketType: true,
                showTerms: true,
                showSupport: true,
            },
            footer: { supportUrl: "", supportEmail: "" },
        };

        return prisma.organizationTicketTemplate.create({
            data: {
                organizationId,
                name,
                layout,
                status: TicketTemplateStatus.DRAFT,
                themeJson: defaultTheme as any,
                version: 1,
            },
        });
    },

    /**
     * Update template data
     */
    async updateTemplate(id: string, data: { name?: string; layout?: TicketTemplateLayout; themeJson?: Partial<ThemeJson> }) {
        const existing = await prisma.organizationTicketTemplate.findUnique({ where: { id } });
        if (!existing) throw new Error("Template not found");

        let updatedTheme = existing.themeJson as unknown as ThemeJson;
        if (data.themeJson) {
            updatedTheme = { ...updatedTheme, ...data.themeJson };
            // Validate with Zod
            themeJsonSchema.parse(updatedTheme);
        }

        return prisma.organizationTicketTemplate.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.layout && { layout: data.layout }),
                ...(data.themeJson && { themeJson: updatedTheme as any }),
            },
        });
    },

    /**
     * Publish template (Transactional)
     * Sets the chosen template to ACTIVE and all others in the same org to ARCHIVED
     */
    async publishTemplate(id: string, userId: string) {
        const template = await prisma.organizationTicketTemplate.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!template) throw new Error("Template not found");

        return prisma.$transaction(async (tx) => {
            // 1. Archive current active templates for this organization
            await tx.organizationTicketTemplate.updateMany({
                where: {
                    organizationId: template.organizationId,
                    status: TicketTemplateStatus.ACTIVE,
                },
                data: {
                    status: TicketTemplateStatus.ARCHIVED,
                },
            });

            // 2. Set the requested template to ACTIVE
            const updated = await tx.organizationTicketTemplate.update({
                where: { id },
                data: {
                    status: TicketTemplateStatus.ACTIVE,
                    // Increment version on publish if needed, or just keep as is
                },
            });

            // 3. Create Audit Log (Note: createAuditLog is async, typically we don't wait for it inside tx if it's external, 
            // but here we want to ensure it's recorded. Since its own tx is inside, we call it after or carefully)
            return updated;
        }).then(async (result) => {
            // Record audit log outside tx to avoid blocking
            await createAuditLog({
                userId,
                action: "TICKET_TEMPLATE_PUBLISHED",
                entityType: "organization_ticket_template",
                entityId: id,
                details: {
                    organizationId: template.organizationId,
                    name: template.name,
                    version: template.version,
                },
            } as any);
            return result;
        });
    },

    /**
     * Archive a template
     */
    async archiveTemplate(id: string) {
        return prisma.organizationTicketTemplate.update({
            where: { id },
            data: { status: TicketTemplateStatus.ARCHIVED },
        });
    },
};
