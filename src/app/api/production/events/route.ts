import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { createManualEventSchema, productionEventFilterSchema } from '@/domains/production'
import { TrackingService } from '@/domains/production'
import { z } from 'zod'
import { withRateLimit, productionRateLimiter } from '@/lib/rate-limit-middleware'

export const runtime = 'nodejs'

// POST /api/production/events - Crea nuovo evento di produzione
async function postHandler(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createManualEventSchema.parse(body)

    const event = await TrackingService.createProductionEvent({
      ...validatedData,
      userId: session.user.id
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 })
    }
    
    console.error('Errore creazione evento produzione:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione dell\'evento' },
      { status: 500 }
    )
  }
}

// GET /api/production/events - Ottieni eventi con filtri
async function getHandler(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = productionEventFilterSchema.parse({
      odlId: searchParams.get('odlId') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    })

    const events = await TrackingService.getProductionEvents(filter)

    return NextResponse.json(events)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parametri non validi', details: error.errors }, { status: 400 })
    }
    
    console.error('Errore recupero eventi:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero degli eventi' },
      { status: 500 }
    )
  }
}

// Export handlers with rate limiting
export const POST = withRateLimit(postHandler, productionRateLimiter);
export const GET = withRateLimit(getHandler, productionRateLimiter);