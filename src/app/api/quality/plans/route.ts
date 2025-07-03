import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QualityControlService } from '@/domains/quality/services/QualityControlService'
import {
  QualityControlPlanCreateSchema,
  QualityControlPlanFilterSchema,
  PaginationSchema,
} from '@/domains/quality/schemas/qualitySchemas'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters and pagination
    const filterParams = Object.fromEntries(searchParams.entries())
    const filters = QualityControlPlanFilterSchema.parse(filterParams)
    const pagination = PaginationSchema.parse(filterParams)

    const result = await QualityControlService.findManyPlans(filters, pagination)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore nel recupero piani di controllo:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica ruolo - solo ADMIN, SUPERVISOR e CAPO_REPARTO possono creare piani
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = QualityControlPlanCreateSchema.parse(body)

    const plan = await QualityControlService.createPlan(
      validatedData,
      session.user.id
    )

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione piano di controllo:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}