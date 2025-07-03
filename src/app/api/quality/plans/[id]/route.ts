import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { QualityControlService } from '@/domains/quality/services/QualityControlService'
import { QualityControlPlanUpdateSchema } from '@/domains/quality/schemas/qualitySchemas'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const plan = await QualityControlService.findPlanById(params.id)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Piano di controllo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Errore nel recupero piano di controllo:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica ruolo
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = QualityControlPlanUpdateSchema.parse(body)

    const plan = await QualityControlService.updatePlan(params.id, validatedData)

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Errore nell\'aggiornamento piano di controllo:', error)
    
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

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Solo ADMIN può eliminare piani
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    await QualityControlService.deletePlan(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore nell\'eliminazione piano di controllo:', error)
    
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