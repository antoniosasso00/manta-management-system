import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeMetricsService } from '@/domains/production/services/TimeMetricsService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { partNumber } = await params
    
    if (!partNumber) {
      return NextResponse.json({ error: 'Part Number richiesto' }, { status: 400 })
    }

    const timeAnalysis = await TimeMetricsService.getPartTimeAnalysis(decodeURIComponent(partNumber))
    
    if (!timeAnalysis) {
      return NextResponse.json({ error: 'Part Number non trovato' }, { status: 404 })
    }

    return NextResponse.json(timeAnalysis)
  } catch (error) {
    console.error('Errore API time-analysis/part:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}