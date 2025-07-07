import { prisma } from './prisma'
import { AuditAction } from '@prisma/client'
import { NextRequest } from 'next/server'

interface AuditLogData {
  action: AuditAction
  resource: string
  resourceId?: string
  userId: string
  userEmail: string
  details?: Record<string, unknown>
  request?: NextRequest
}

export async function logAuditAction({
  action,
  resource,
  resourceId,
  userId,
  userEmail,
  details,
  request
}: AuditLogData) {
  try {
    // Extract IP address and User Agent from request if available
    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (request) {
      // Get IP address from various headers (for proxy setups)
      ipAddress = 
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown'
      
      userAgent = request.headers.get('user-agent') || undefined
    }

    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        userId,
        userEmail,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress,
        userAgent,
      }
    })
  } catch (error) {
    console.error('Failed to log audit action:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper functions for common audit actions
export const auditHelpers = {
  async logUserCreate(adminUserId: string, adminEmail: string, createdUser: Record<string, unknown>, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.CREATE,
      resource: 'User',
      resourceId: String(createdUser.id),
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        createdUser: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role,
          departmentId: createdUser.departmentId,
          departmentRole: createdUser.departmentRole,
        }
      },
      request
    })
  },

  async logUserUpdate(adminUserId: string, adminEmail: string, userId: string, before: Record<string, unknown>, after: Record<string, unknown>, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.UPDATE,
      resource: 'User',
      resourceId: userId,
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        before: {
          name: before.name,
          email: before.email,
          role: before.role,
          departmentId: before.departmentId,
          departmentRole: before.departmentRole,
          isActive: before.isActive,
        },
        after: {
          name: after.name,
          email: after.email,
          role: after.role,
          departmentId: after.departmentId,
          departmentRole: after.departmentRole,
          isActive: after.isActive,
        }
      },
      request
    })
  },

  async logUserDelete(adminUserId: string, adminEmail: string, deletedUser: Record<string, unknown>, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.DELETE,
      resource: 'User',
      resourceId: String(deletedUser.id),
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        deletedUser: {
          id: deletedUser.id,
          email: deletedUser.email,
          name: deletedUser.name,
          role: deletedUser.role,
          departmentId: deletedUser.departmentId,
          departmentRole: deletedUser.departmentRole,
        }
      },
      request
    })
  },

  async logBulkStatusUpdate(adminUserId: string, adminEmail: string, userIds: string[], isActive: boolean, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.BULK_UPDATE,
      resource: 'User',
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'bulk_status_update',
        userIds,
        isActive,
        count: userIds.length
      },
      request
    })
  },

  async logBulkDelete(adminUserId: string, adminEmail: string, userIds: string[], request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.BULK_DELETE,
      resource: 'User',
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'bulk_delete',
        userIds,
        count: userIds.length
      },
      request
    })
  },

  async logUserExport(adminUserId: string, adminEmail: string, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.EXPORT,
      resource: 'User',
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'export_users'
      },
      request
    })
  },

  async logUserImport(adminUserId: string, adminEmail: string, importResult: Record<string, unknown>, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.IMPORT,
      resource: 'User',
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'import_users',
        result: importResult
      },
      request
    })
  },

  async logDataExport(adminUserId: string, adminEmail: string, resource: string, description: string, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.EXPORT,
      resource,
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'data_export',
        description
      },
      request
    })
  },

  async logDataImport(adminUserId: string, adminEmail: string, resource: string, description: string, request?: NextRequest) {
    await logAuditAction({
      action: AuditAction.IMPORT,
      resource,
      userId: adminUserId,
      userEmail: adminEmail,
      details: {
        operation: 'data_import',
        description
      },
      request
    })
  }
}