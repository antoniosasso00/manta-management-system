import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditHelpers } from '@/lib/audit-logger'

const bulkStatusSchema = z.object({
  userIds: z.array(z.string()),
  isActive: z.boolean()
})

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const { userIds, isActive } = bulkStatusSchema.parse(body)

    // Prevent admin from disabling themselves
    if (!isActive && userIds.includes(adminUser.user.id)) {
      return NextResponse.json(
        { error: 'Non puoi disattivare il tuo account' },
        { status: 400 }
      )
    }

    // Check if we're trying to disable the last admin
    if (!isActive) {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true,
          id: { notIn: userIds }
        }
      })

      if (adminCount === 0) {
        return NextResponse.json(
          { error: 'Non puoi disattivare tutti gli amministratori' },
          { status: 400 }
        )
      }
    }

    // Update users status
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        isActive
      }
    })

    // Log audit action
    await auditHelpers.logBulkStatusUpdate(adminUser.user.id, adminUser.user.email, userIds, isActive, request)

    return NextResponse.json({
      message: `${result.count} utenti ${isActive ? 'attivati' : 'disattivati'} con successo`,
      count: result.count
    })

  } catch (error) {
    console.error('Bulk status update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}