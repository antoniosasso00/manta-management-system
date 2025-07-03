import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { QualityInspectionService } from '@/domains/quality/services/QualityInspectionService'
import { QualityInspectionCompleteSchema } from '@/domains/quality/schemas/qualitySchemas'

interface Params {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = QualityInspectionCompleteSchema.parse({
      ...body,
      inspectionId: params.id,
    })

    const inspection = await QualityInspectionService.completeInspection(
      validatedData,
      session.user.id
    )

    return NextResponse.json(inspection)
  } catch (error) {
    console.error('Errore nel completamento ispezione:', error)
    
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