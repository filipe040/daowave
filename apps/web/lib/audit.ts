/**
 * Audit logging service
 * Logs important actions for security and compliance
 */

import { prisma } from "./prisma";

export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType?: string; // Deprecated, use entityType
  resourceId?: string; // Deprecated, use entityId
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Map to Prisma schema fields
    const entityType = data.entityType || data.resourceType || "unknown";
    const entityId = data.entityId || data.resourceId;
    
    // Combine all metadata into metaJson
    const metaJson: Record<string, any> = {};
    if (data.details) {
      Object.assign(metaJson, data.details);
    }
    if (data.ipAddress) {
      metaJson.ipAddress = data.ipAddress;
    }
    if (data.userAgent) {
      metaJson.userAgent = data.userAgent;
    }
    
    await prisma.auditLog.create({
      data: {
        actorUserId: data.userId || null,
        action: data.action,
        entityType: entityType,
        entityId: entityId || null,
        metaJson: Object.keys(metaJson).length > 0 ? metaJson : null,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
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

