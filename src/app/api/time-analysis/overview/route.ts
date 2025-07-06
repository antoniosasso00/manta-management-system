import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeMetricsService } from '@/domains/production/services/TimeMetricsService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'odl' // 'odl' | 'part'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let data
    
    if (view === 'part') {
      data = await TimeMetricsService.getPartTimeAnalysisList()
    } else {
      data = await TimeMetricsService.getODLTimeAnalysisList(limit, offset)
    }

    return NextResponse.json({
      view,
      data,
      pagination: {
        limit,
        offset,
        hasMore: view === 'odl' ? data.length === limit : false
      }
    })
  } catch (error) {
    console.error('Errore API time-analysis/overview:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}