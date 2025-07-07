import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { passwordSchema } from '@/lib/password-validation'

export const runtime = 'nodejs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
  password: passwordSchema,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
      
      return NextResponse.json(
        { error: 'Token scaduto. Richiedi un nuovo reset password' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token già utilizzato' },
        { status: 400 }
      )
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { error: 'Account disattivato' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    // Delete all other reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id }
      }
    })

    return NextResponse.json({
      message: 'Password reimpostata con successo'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    
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

// Verify token endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token richiesto' },
        { status: 400 }
      )
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true, isActive: true } } },
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Token non valido' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Token scaduto' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'Token già utilizzato' },
        { status: 400 }
      )
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Account disattivato' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.user.email
    })

  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}