import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    // Prevent self-modification
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi modificare lo stato del tuo account' },
        { status: 400 }
      )
    }

    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Prevent disabling the last admin
    if (user.role === UserRole.ADMIN && user.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { 
          role: UserRole.ADMIN,
          isActive: true
        }
      })

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Non puoi disattivare l\'ultimo amministratore attivo' },
          { status: 400 }
        )
      }
    }

    // Toggle status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      message: `Utente ${updatedUser.isActive ? 'attivato' : 'disattivato'} con successo`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}