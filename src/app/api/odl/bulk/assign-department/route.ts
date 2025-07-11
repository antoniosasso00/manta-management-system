import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { prisma } from '@/lib/prisma'
import { TrackingService } from '@/domains/production/services/TrackingService'
import { EventType } from '@prisma/client'
import { z } from 'zod'

const bulkAssignDepartmentSchema = z.object({
  odlIds: z.array(z.string().min(1, 'ODL ID richiesto')),
  departmentId: z.string().min(1, 'Department ID richiesto'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Solo ADMIN e SUPERVISOR possono assegnare ODL in bulk
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bulkAssignDepartmentSchema.parse(body)
    const { odlIds, departmentId, notes } = validatedData

    if (odlIds.length === 0) {
      return NextResponse.json({ error: 'Nessun ODL selezionato' }, { status: 400 })
    }

    // Verifica che il reparto esista
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    })

    if (!department) {
      return NextResponse.json({ error: 'Reparto non trovato' }, { status: 404 })
    }

    // Recupera tutti gli ODL selezionati
    const odls = await prisma.oDL.findMany({
      where: { id: { in: odlIds } },
      include: { part: true }
    })

    if (odls.length !== odlIds.length) {
      return NextResponse.json({ 
        error: 'Alcuni ODL selezionati non sono stati trovati' 
      }, { status: 404 })
    }

    // Verifica che tutti gli ODL siano in uno stato compatibile per l'assegnazione
    const compatibleStatuses = [
      'CREATED',
      'CLEANROOM_COMPLETED',
      'AUTOCLAVE_COMPLETED', 
      'CONTROLLO_NUMERICO_COMPLETED',
      'NDI_COMPLETED',
      'MONTAGGIO_COMPLETED',
      'VERNICIATURA_COMPLETED'
    ]

    const incompatibleODLs = odls.filter(odl => !compatibleStatuses.includes(odl.status))
    if (incompatibleODLs.length > 0) {
      return NextResponse.json({ 
        error: `ODL in stati incompatibili: ${incompatibleODLs.map(odl => `${odl.odlNumber} (${odl.status})`).join(', ')}` 
      }, { status: 400 })
    }

    // Verifica che nessun ODL abbia già eventi attivi in questo reparto
    const conflictingODLs = []
    
    for (const odl of odls) {
      const existingEvents = await prisma.productionEvent.findMany({
        where: {
          odlId: odl.id,
          departmentId,
          eventType: 'ENTRY'
        },
        orderBy: { timestamp: 'desc' },
        take: 1
      })

      const lastExitEvent = await prisma.productionEvent.findFirst({
        where: {
          odlId: odl.id,
          departmentId,
          eventType: 'EXIT'
        },
        orderBy: { timestamp: 'desc' }
      })

      // Se c'è un ENTRY senza EXIT corrispondente, l'ODL è già in lavorazione
      if (existingEvents.length > 0 && (!lastExitEvent || lastExitEvent.timestamp < existingEvents[0].timestamp)) {
        conflictingODLs.push(odl.odlNumber)
      }
    }

    if (conflictingODLs.length > 0) {
      return NextResponse.json({ 
        error: `ODL già in lavorazione in questo reparto: ${conflictingODLs.join(', ')}` 
      }, { status: 400 })
    }

    // Esegui l'assegnazione in bulk
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const odl of odls) {
      try {
        await TrackingService.createProductionEvent({
          odlId: odl.id,
          departmentId,
          eventType: EventType.ASSIGNED,
          userId: session.user.id,
          notes: notes ? `Assegnazione multipla: ${notes}` : 'Assegnazione multipla',
          confirmationRequired: false
        })
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`${odl.odlNumber}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
        console.error(`Errore assegnazione ODL ${odl.odlNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      message: `Assegnazione completata: ${results.success} ODL assegnati${results.failed > 0 ? `, ${results.failed} falliti` : ''}`,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error) {
    console.error('Errore assegnazione bulk ODL:', error)
    
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