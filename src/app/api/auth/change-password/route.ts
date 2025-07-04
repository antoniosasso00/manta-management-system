import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { passwordSchema } from '@/lib/password-validation'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        password: true,
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Password attuale non corretta' },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await compare(
      validatedData.newPassword,
      user.password
    )

    if (isSamePassword) {
      return NextResponse.json(
        { error: 'La nuova password deve essere diversa da quella attuale' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        password: hashedNewPassword,
      }
    })

    return NextResponse.json({
      message: 'Password cambiata con successo'
    })

  } catch (error) {
    console.error('Change password error:', error)
    
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