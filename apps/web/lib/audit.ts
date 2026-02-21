/**
 * Audit logging service
 * Logs important actions for security and compliance
 */

import { prisma } from "./prisma";

export interface AuditLogData {
  userId?: string;
  organizationId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const entityType = data.entityType || "unknown";

    // metaJson is for additional context not in main columns
    const metaJson = data.details || {};

    await prisma.auditLog.create({
      data: {
        actorUserId: data.userId || null,
        organizationId: data.organizationId || null,
        action: data.action,
        entityType: entityType,
        entityId: data.entityId || null,
        metaJson: Object.keys(metaJson).length > 0 ? metaJson : undefined,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resourceType?: string; // Deprecated, use entityType
  resourceId?: string; // Deprecated, use entityId
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) {
  return prisma.auditLog.findMany({
    where: {
      ...(filters.userId && { actorUserId: filters.userId }),
      ...(filters.action && { action: filters.action }),
      ...((filters.entityType || filters.resourceType) && {
        entityType: filters.entityType || filters.resourceType
      }),
      ...((filters.entityId || filters.resourceId) && {
        entityId: filters.entityId || filters.resourceId
      }),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

