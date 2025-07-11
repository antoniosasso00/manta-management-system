import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { PartService } from '@/domains/core/services/PartService'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statistics = await PartService.getStatistics()
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching part statistics:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}