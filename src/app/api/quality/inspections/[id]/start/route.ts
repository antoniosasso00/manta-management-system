import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QualityInspectionService } from '@/domains/quality/services/QualityInspectionService'
import { QualityInspectionStartSchema } from '@/domains/quality/schemas/qualitySchemas'

interface Params {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const validatedData = QualityInspectionStartSchema.parse({
      inspectionId: params.id,
    })

    const inspection = await QualityInspectionService.startInspection(
      validatedData,
      session.user.id
    )

    return NextResponse.json(inspection)
  } catch (error) {
    console.error('Errore nell\'avvio ispezione:', error)
    
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