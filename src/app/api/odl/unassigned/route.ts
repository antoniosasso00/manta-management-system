import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { TrackingService } from '@/domains/production/services/TrackingService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Solo ADMIN e SUPERVISOR possono vedere ODL non assegnati
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const unassignedODLs = await TrackingService.getUnassignedODLs()
    
    return NextResponse.json({
      odls: unassignedODLs,
      count: unassignedODLs.length
    })
  } catch (error) {
    console.error('Errore recupero ODL non assegnati:', error)
    
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}