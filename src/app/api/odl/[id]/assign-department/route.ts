import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { prisma } from '@/lib/prisma'
import { TrackingService } from '@/domains/production/services/TrackingService'
import { EventType, ODLStatus } from '@prisma/client'
import { z } from 'zod'
import { isValidStatusTransition, getTransitionErrorMessage } from '@/utils/status-transitions'

const assignDepartmentSchema = z.object({
  departmentId: z.string().min(1, 'Department ID richiesto'),
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Solo ADMIN e SUPERVISOR possono assegnare ODL manualmente
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const { id: odlId } = await params
    const body = await request.json()
    
    const validatedData = assignDepartmentSchema.parse(body)
    const { departmentId, notes } = validatedData

    // Verifica che l'ODL esista
    const odl = await prisma.oDL.findUnique({
      where: { id: odlId },
      include: { part: true }
    })

    if (!odl) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 })
    }

    // Verifica che il reparto esista
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    })

    if (!department) {
      return NextResponse.json({ error: 'Reparto non trovato' }, { status: 404 })
    }

    // Verifica transizione di stato valida per assegnazione (ASSIGNED_TO_*)
    const assignedStatus = `ASSIGNED_TO_${department.type}` as ODLStatus
    const isValidTransition = isValidStatusTransition(odl.status, assignedStatus)
    if (!isValidTransition) {
      const errorMessage = getTransitionErrorMessage(odl.status, assignedStatus)
      return NextResponse.json({ 
        error: `Transizione di stato non valida: ${errorMessage}` 
      }, { status: 400 })
    }

    // Verifica che l'ODL non abbia già eventi attivi in questo reparto
    const existingEvents = await prisma.productionEvent.findMany({
      where: {
        odlId,
        departmentId,
        eventType: 'ENTRY'
      },
      orderBy: { timestamp: 'desc' },
      take: 1
    })

    const lastExitEvent = await prisma.productionEvent.findFirst({
      where: {
        odlId,
        departmentId,
        eventType: 'EXIT'
      },
      orderBy: { timestamp: 'desc' }
    })

    // Se c'è un ENTRY senza EXIT corrispondente, l'ODL è già in lavorazione
    if (existingEvents.length > 0 && (!lastExitEvent || lastExitEvent.timestamp < existingEvents[0].timestamp)) {
      return NextResponse.json({ 
        error: 'ODL già in lavorazione in questo reparto' 
      }, { status: 400 })
    }

    // Crea evento di assegnazione manuale
    const assignmentEvent = await TrackingService.createProductionEvent({
      odlId,
      departmentId,
      eventType: EventType.ASSIGNED,
      userId: session.user.id,
      notes: notes ? `Assegnazione manuale: ${notes}` : 'Assegnazione manuale',
      confirmationRequired: false
    })

    return NextResponse.json({
      success: true,
      message: 'ODL assegnato con successo al reparto',
      event: assignmentEvent
    })

  } catch (error) {
    console.error('Errore assegnazione ODL:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Errore interno del server' 
    }, { status: 500 })
  }
}