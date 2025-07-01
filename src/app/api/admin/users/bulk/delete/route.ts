import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditHelpers } from '@/lib/audit-logger'

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string())
})

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const { userIds } = bulkDeleteSchema.parse(body)

    // Prevent admin from deleting themselves
    if (userIds.includes(adminUser.user.id)) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo account' },
        { status: 400 }
      )
    }

    // Check if we're trying to delete the last admin
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
        id: { notIn: userIds }
      }
    })

    if (adminCount === 0) {
      return NextResponse.json(
        { error: 'Non puoi eliminare tutti gli amministratori' },
        { status: 400 }
      )
    }

    // Delete related records first (cascade delete)
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: { in: userIds }
      }
    })

    await prisma.session.deleteMany({
      where: {
        userId: { in: userIds }
      }
    })

    // Delete users
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds }
      }
    })

    // Log audit action
    await auditHelpers.logBulkDelete(adminUser.user.id, adminUser.user.email, userIds, request)

    return NextResponse.json({
      message: `${result.count} utenti eliminati con successo`,
      count: result.count
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    
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