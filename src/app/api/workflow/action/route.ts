import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-node'
import { prisma } from '@/lib/prisma'
import { WorkflowService } from '@/domains/production/services/WorkflowService'
import { ResponseHelper, ErrorHelper } from '@/lib/api-helpers'
import { EventType } from '@prisma/client'

// Schema per validazione input azione workflow unificata
const workflowActionSchema = z.object({
  odlId: z.string().cuid('ID ODL non valido'),
  departmentId: z.string().cuid('ID reparto non valido'),
  actionType: z.nativeEnum(EventType, { 
    errorMap: () => ({ message: 'Tipo azione non valido' })
  }),
  notes: z.string().optional(),
  confirmationRequired: z.boolean().default(true),
  forceTransfer: z.boolean().default(false), // Per supervisori
  metadata: z.object({
    duration: z.number().optional(), // Durata timer in millisecondi
    location: z.string().optional(), // Posizione fisica specifica
    batchId: z.string().optional(), // Per gestione batch autoclavi
  }).optional()
})

type WorkflowActionInput = z.infer<typeof workflowActionSchema>

interface WorkflowActionResponse {
  success: boolean
  message: string
  event?: {
    id: string
    eventType: EventType
    timestamp: Date
  }
  autoTransfer?: {
    success: boolean
    message: string
    newStatus?: string
    nextDepartment?: {
      id: string
      name: string
      type: string
    }
  }
  warnings?: string[]
}

/**
 * API Route Unificata per Azioni Workflow
 * 
 * Gestisce tutte le azioni ENTRY/EXIT/PAUSE/RESUME sia da UI che da QR scanner
 * Mantiene piena compatibilità con il sistema QR esistente
 */
export const POST = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  try {
    const body = await request.json()
    const validatedInput = workflowActionSchema.parse(body)
    
    // Verifica che l'utente abbia accesso al reparto
    const hasAccess = await verifyDepartmentAccess(session.user.id, validatedInput.departmentId)
    if (!hasAccess) {
      return ResponseHelper.forbidden('Accesso negato al reparto specificato')
    }

    // Verifica che l'ODL esista e sia valido
    const odl = await prisma.oDL.findUnique({
      where: { id: validatedInput.odlId },
      include: {
        part: true,
        events: {
          where: { departmentId: validatedInput.departmentId },
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    })

    if (!odl) {
      return ResponseHelper.notFound('ODL non trovato')
    }

    // Valida l'azione richiesta
    const validation = await validateAction(odl, validatedInput)
    if (!validation.isValid) {
      return ResponseHelper.validationError(validation.reason!, validation.warnings)
    }

    // Esegui l'azione in base al tipo
    const result = await executeWorkflowAction(validatedInput, session.user.id, odl)
    
    if (!result.success) {
      return ResponseHelper.conflict(result.message)
    }

    return ResponseHelper.success(result)

  } catch (error) {
    console.error('Workflow action error:', error)
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.validationError(
        'Dati di input non validi',
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      )
    }

    throw error // Lascia che ErrorHelper gestisca altri errori
  }
})

/**
 * Verifica che l'utente abbia accesso al reparto specificato
 */
async function verifyDepartmentAccess(userId: string, departmentId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        departmentId: true,
        isActive: true 
      }
    })

    if (!user || !user.isActive) {
      return false
    }

    // Admin e Supervisor hanno accesso a tutti i reparti
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
      return true
    }

    // Altri utenti solo al proprio reparto
    return user.departmentId === departmentId

  } catch (error) {
    console.error('Department access verification error:', error)
    return false
  }
}

/**
 * Valida se l'azione richiesta è logica per lo stato attuale dell'ODL
 */
async function validateAction(
  odl: any, 
  input: WorkflowActionInput
): Promise<{ isValid: boolean; reason?: string; warnings?: string[] }> {
  
  const warnings: string[] = []
  
  // Stati che indicano completamento nel reparto
  const completedStates = [
    'CLEANROOM_COMPLETED', 'AUTOCLAVE_COMPLETED', 'CONTROLLO_NUMERICO_COMPLETED',
    'NDI_COMPLETED', 'MONTAGGIO_COMPLETED', 'VERNICIATURA_COMPLETED',
    'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED'
  ]
  
  // Se l'ODL è completato, solo supervisori possono fare azioni speciali
  if (completedStates.includes(odl.status) && input.actionType !== 'NOTE') {
    return {
      isValid: false,
      reason: `ODL già completato in questo reparto (stato: ${odl.status})`
    }
  }

  // Trova l'ultimo evento per questo reparto
  const lastEvent = odl.events[0] // Eventi sono ordinati per timestamp desc
  
  // Logica di validazione basata sull'ultimo evento
  switch (input.actionType) {
    case 'ENTRY':
      if (lastEvent?.eventType === 'ENTRY') {
        return {
          isValid: false,
          reason: 'ODL già in ingresso in questo reparto'
        }
      }
      break

    case 'EXIT':
      if (!lastEvent || lastEvent.eventType !== 'ENTRY') {
        if (lastEvent?.eventType === 'RESUME') {
          // OK - possiamo uscire dopo RESUME
          break
        }
        return {
          isValid: false,
          reason: 'Impossibile uscire senza prima essere entrato'
        }
      }
      break

    case 'PAUSE':
      if (!lastEvent || !['ENTRY', 'RESUME'].includes(lastEvent.eventType)) {
        return {
          isValid: false,
          reason: 'Impossibile mettere in pausa senza essere in lavorazione'
        }
      }
      break

    case 'RESUME':
      if (!lastEvent || lastEvent.eventType !== 'PAUSE') {
        return {
          isValid: false,
          reason: 'Impossibile riprendere senza essere in pausa'
        }
      }
      break

    case 'NOTE':
      // Le note sono sempre permesse
      break

    default:
      return {
        isValid: false,
        reason: 'Tipo di azione non riconosciuto'
      }
  }

  // Controlli aggiuntivi per azioni specifiche
  if (input.actionType === 'EXIT') {
    // Verifica che non ci siano dipendenze che impediscono l'uscita
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId }
    })
    
    if (department?.type === 'AUTOCLAVE') {
      // Verifica batch attivi
      const activeBatch = await prisma.autoclaveLoad.findFirst({
        where: {
          status: { in: ['IN_CURE', 'READY'] },
          loadItems: {
            some: { odlId: odl.id }
          }
        }
      })
      
      if (activeBatch && !input.forceTransfer) {
        warnings.push('ODL è in un batch autoclave attivo. Verificare prima di procedere.')
      }
    }
  }

  return { 
    isValid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  }
}

/**
 * Esegue l'azione workflow richiesta
 */
async function executeWorkflowAction(
  input: WorkflowActionInput,
  userId: string,
  odl: any
): Promise<WorkflowActionResponse> {
  
  try {
    // 1. Crea l'evento di produzione
    const event = await prisma.productionEvent.create({
      data: {
        odlId: input.odlId,
        departmentId: input.departmentId,
        userId: userId,
        eventType: input.actionType,
        notes: input.notes,
        duration: input.metadata?.duration,
        isAutomatic: false // Azione manuale da UI o QR
      }
    })

    const response: WorkflowActionResponse = {
      success: true,
      message: `Azione ${input.actionType} registrata con successo`,
      event: {
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp
      }
    }

    // 2. Se è un EXIT, tenta il trasferimento automatico
    if (input.actionType === 'EXIT') {
      try {
        const transferResult = await WorkflowService.executeAutoTransfer({
          odlId: input.odlId,
          currentDepartmentId: input.departmentId,
          userId: userId,
          notes: input.notes,
          forceTransfer: input.forceTransfer
        })

        response.autoTransfer = transferResult
        
        if (transferResult.success) {
          response.message += ` e trasferito automaticamente a ${transferResult.nextDepartment?.name}`
        } else {
          response.warnings = [
            'Evento registrato ma trasferimento automatico fallito: ' + transferResult.message
          ]
        }

      } catch (transferError) {
        console.error('Auto transfer error:', transferError)
        response.warnings = [
          'Evento registrato ma trasferimento automatico non riuscito. Procedere manualmente.'
        ]
      }
    }

    // 3. Aggiorna timestamp ultima attività ODL
    await prisma.oDL.update({
      where: { id: input.odlId },
      data: { updatedAt: new Date() }
    })

    return response

  } catch (error) {
    console.error('Execute workflow action error:', error)
    return {
      success: false,
      message: 'Errore durante l\'esecuzione dell\'azione. Riprovare.'
    }
  }
}

/**
 * GET: Ottiene azioni disponibili per un ODL in un reparto
 */
export const GET = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const odlId = searchParams.get('odlId')
  const departmentId = searchParams.get('departmentId')

  if (!odlId || !departmentId) {
    return ResponseHelper.validationError('odlId e departmentId sono richiesti')
  }

  try {
    // Verifica accesso al reparto
    const hasAccess = await verifyDepartmentAccess(session.user.id, departmentId)
    if (!hasAccess) {
      return ResponseHelper.forbidden()
    }

    // Recupera ODL con eventi
    const odl = await prisma.oDL.findUnique({
      where: { id: odlId },
      include: {
        events: {
          where: { departmentId },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!odl) {
      return ResponseHelper.notFound('ODL non trovato')
    }

    // Determina azioni disponibili
    const availableActions = getAvailableActions(odl)

    return ResponseHelper.success({
      odlId,
      departmentId,
      currentStatus: odl.status,
      lastEvent: odl.events[0] || null,
      availableActions
    })

  } catch (error) {
    console.error('Get available actions error:', error)
    throw error
  }
})

/**
 * Determina le azioni disponibili per un ODL in base al suo stato
 */
function getAvailableActions(odl: any): EventType[] {
  const completedStates = [
    'CLEANROOM_COMPLETED', 'AUTOCLAVE_COMPLETED', 'CONTROLLO_NUMERICO_COMPLETED',
    'NDI_COMPLETED', 'MONTAGGIO_COMPLETED', 'VERNICIATURA_COMPLETED',
    'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED'
  ]
  
  if (completedStates.includes(odl.status)) {
    return [] // Nessuna azione disponibile se completato
  }
  
  const lastEvent = odl.events[0]
  
  if (!lastEvent) {
    return ['ENTRY']
  }
  
  switch (lastEvent.eventType) {
    case 'ENTRY':
      return ['EXIT', 'PAUSE']
    case 'EXIT':
      return [] // Già uscito
    case 'PAUSE':
      return ['RESUME']
    case 'RESUME':
      return ['EXIT', 'PAUSE']
    default:
      return ['ENTRY']
  }
}