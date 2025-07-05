import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { TrackingService } from '@/domains/production'

// GET /api/production/events/odl/[id] - Ottieni stato tracking di un ODL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    const trackingStatus = await TrackingService.getODLTrackingStatus(id)

    if (!trackingStatus) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 })
    }

    return NextResponse.json(trackingStatus)
  } catch (error) {
    console.error('Errore recupero stato tracking ODL:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero dello stato tracking' },
      { status: 500 }
    )
  }
}