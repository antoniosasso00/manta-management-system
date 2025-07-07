import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { emailService } from '@/lib/email-service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAdmin()

    const config = emailService.getConfiguration()
    
    return NextResponse.json({
      message: 'Email service configuration',
      config
    })

  } catch (error) {
    console.error('Email config check error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero configurazione email' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await requireAdmin()

    const result = await emailService.testConfiguration()
    
    if (result.success) {
      return NextResponse.json({
        message: 'Test email inviato con successo',
        result
      })
    } else {
      return NextResponse.json({
        message: 'Test email fallito',
        result
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Errore durante il test email' },
      { status: 500 }
    )
  }
}