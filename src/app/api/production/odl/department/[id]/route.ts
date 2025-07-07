import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { TrackingService } from '@/domains/production'

export const runtime = 'nodejs'

// GET /api/production/odl/department/[id] - Ottieni ODL per reparto
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
    const departmentODLList = await TrackingService.getDepartmentODLList(id)

    return NextResponse.json(departmentODLList)
  } catch (error) {
    console.error('Errore recupero ODL reparto:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero degli ODL del reparto' },
      { status: 500 }
    )
  }
}