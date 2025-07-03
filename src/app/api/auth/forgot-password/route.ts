import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import { redisRateLimiter, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit-redis'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for password reset requests
    const clientId = await getClientIdentifier(request)
    const rateLimitResult = await redisRateLimiter.checkLimit(clientId, RATE_LIMIT_CONFIGS.PASSWORD_RESET)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova più tardi.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    })

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({
        message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      }
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    const emailResult = await emailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name || undefined,
      resetUrl,
      expiresIn: '1 ora',
    })

    // In production, if email fails, we should fail the request
    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      // Clean up the created token since email failed
      await prisma.passwordResetToken.delete({
        where: { token: resetToken }
      })
      
      return NextResponse.json(
        { error: 'Servizio email temporaneamente non disponibile. Riprova più tardi.' },
        { status: 503 }
      )
    }

    // Log email result for monitoring
    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error, emailResult.provider)
    }

    // In development, include the token for testing
    const responseData: Record<string, unknown> = {
      message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset'
    }

    if (process.env.NODE_ENV === 'development') {
      responseData.resetToken = resetToken
      responseData.resetUrl = resetUrl
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}