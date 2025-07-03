import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QualityInspectionService } from '@/domains/quality/services/QualityInspectionService'
import {
  QualityInspectionCreateSchema,
  QualityInspectionFilterSchema,
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
    const filters = QualityInspectionFilterSchema.parse(filterParams)
    const pagination = PaginationSchema.parse(filterParams)

    // Se non è admin, filtra per ispettore
    if (session.user.role === 'OPERATOR') {
      filters.inspectorId = session.user.id
    }

    const result = await QualityInspectionService.findManyInspections(filters, pagination)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore nel recupero ispezioni:', error)
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

    // Verifica ruolo - solo ADMIN, SUPERVISOR e CAPO_REPARTO possono creare ispezioni
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = QualityInspectionCreateSchema.parse(body)

    const inspection = await QualityInspectionService.createInspection(validatedData)

    return NextResponse.json(inspection, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione ispezione:', error)
    
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