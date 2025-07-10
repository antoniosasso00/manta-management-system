import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { TrackingService } from '@/domains/production/services/TrackingService'
import { EventType } from '@prisma/client'
import { z } from 'zod'
import { QRHelper } from '@/utils/qr-validation'

const qrScanSchema = z.object({
  qrCode: z.string().min(1, 'QR Code richiesto'),
  departmentId: z.string().min(1, 'Department ID richiesto'),
  eventType: z.nativeEnum(EventType, {
    errorMap: () => ({ message: 'Tipo evento non valido' })
  }),
  notes: z.string().optional(),
  duration: z.number().optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = qrScanSchema.parse(body)
    const { qrCode, departmentId, eventType, notes, duration, location } = validatedData

    // Validazione QR Code
    const qrValidation = QRHelper.validateQRCode(qrCode)
    if (!qrValidation.isValid) {
      return NextResponse.json({ 
        error: 'QR Code non valido',
        details: qrValidation.error
      }, { status: 400 })
    }

    // Rate limiting per scansioni multiple
    const rateLimitCheck = QRHelper.checkRateLimit(qrCode, session.user.id)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ 
        error: 'Troppe scansioni ravvicinate',
        details: `Riprova tra ${rateLimitCheck.retryAfter} secondi`,
        retryAfter: rateLimitCheck.retryAfter
      }, { status: 429 })
    }

    // Estrai ODL ID dal QR Code
    const odlId = qrValidation.odlId!
    
    if (!odlId) {
      return NextResponse.json({ 
        error: 'QR Code non contiene ODL ID valido'
      }, { status: 400 })
    }

    // Crea evento di produzione
    const event = await TrackingService.createProductionEvent({
      odlId,
      departmentId,
      eventType,
      userId: session.user.id,
      notes: notes || `Scansione QR ${eventType} - ${session.user.name}`,
      duration,
      confirmationRequired: false
    })

    // Log geolocation se disponibile
    if (location?.latitude && location?.longitude) {
      console.log(`QR scan location: ${location.latitude}, ${location.longitude}`)
    }

    return NextResponse.json({
      success: true,
      message: `Evento ${eventType} registrato con successo`,
      event: {
        id: event.id,
        odlId: event.odlId,
        departmentId: event.departmentId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        odl: {
          odlNumber: event.odl.odlNumber,
          partNumber: event.odl.part.partNumber,
          status: event.odl.status
        },
        department: {
          name: event.department.name,
          code: event.department.code
        },
        user: {
          name: event.user?.name || 'Utente sconosciuto',
          email: event.user?.email || 'N/A'
        }
      }
    })

  } catch (error) {
    console.error('Errore scansione QR:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 })
    }

    // Gestione errori specifici del TrackingService
    if (error instanceof Error) {
      if (error.message.includes('Transizione di stato non valida')) {
        return NextResponse.json({ 
          error: 'Transizione non valida',
          details: error.message
        }, { status: 400 })
      }
      
      if (error.message.includes('ODL non trovato')) {
        return NextResponse.json({ 
          error: 'ODL non trovato',
          details: 'Il QR Code potrebbe essere danneggiato o non valido'
        }, { status: 404 })
      }
      
      if (error.message.includes('Reparto non trovato')) {
        return NextResponse.json({ 
          error: 'Reparto non trovato',
          details: 'Il reparto specificato non esiste'
        }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      error: 'Errore interno del server',
      details: 'Si è verificato un errore durante la scansione del QR Code'
    }, { status: 500 })
  }
}

/**
 * GET endpoint per verificare lo stato di un QR Code
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const qrCode = searchParams.get('qrCode')
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code richiesto' }, { status: 400 })
    }

    // Validazione QR Code
    const qrValidation = QRHelper.validateQRCode(qrCode)
    if (!qrValidation.isValid) {
      return NextResponse.json({ 
        error: 'QR Code non valido',
        details: qrValidation.error
      }, { status: 400 })
    }

    const odlId = qrValidation.odlId!
    
    if (!odlId) {
      return NextResponse.json({ 
        error: 'QR Code non contiene ODL ID valido'
      }, { status: 400 })
    }

    // Ottieni stato tracking ODL
    const trackingStatus = await TrackingService.getODLTrackingStatus(odlId)
    
    if (!trackingStatus) {
      return NextResponse.json({ 
        error: 'ODL non trovato',
        details: 'Il QR Code potrebbe essere danneggiato o non valido'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      qrCode,
      odl: trackingStatus
    })

  } catch (error) {
    console.error('Errore verifica QR:', error)
    
    return NextResponse.json({ 
      error: 'Errore interno del server',
      details: 'Si è verificato un errore durante la verifica del QR Code'
    }, { status: 500 })
  }
}