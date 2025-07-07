import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action') || ''
    const resource = searchParams.get('resource') || ''
    const userId = searchParams.get('userId') || ''

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (action) {
      where.action = action
    }
    
    if (resource) {
      where.resource = resource
    }
    
    if (userId) {
      where.userId = userId
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get audit logs with filters and pagination
    const auditLogs = await prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        userId: true,
        userEmail: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        timestamp: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({ 
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}