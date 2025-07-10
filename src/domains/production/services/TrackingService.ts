import { EventType, ODLStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { WorkflowService } from './WorkflowService'
import { TimeMetricsService } from './TimeMetricsService'
import { isValidDepartmentEntry, isValidDepartmentExit, getTransitionErrorMessage } from '@/utils/status-transitions'
import { TransactionRetryHelper } from '@/utils/transaction-retry'
import type { 
  CreateManualEvent, 
  ProductionEventFilter, 
  ProductionEventResponse,
  ODLTrackingStatus,
  DepartmentODLList 
} from '../schemas/tracking.schema'

export class TrackingService {
  // Crea un nuovo evento di produzione (manuale o QR)
  static async createProductionEvent(data: CreateManualEvent & { userId: string }): Promise<ProductionEventResponse> {
    return TransactionRetryHelper.executePrismaWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
      // Verifica che l'ODL esista con lock ottimistico
      const odl = await tx.oDL.findUnique({
        where: { id: data.odlId },
        include: { part: true }
      })
      
      if (!odl) {
        throw new Error('ODL non trovato')
      }

      // Verifica che il reparto esista
      const department = await tx.department.findUnique({
        where: { id: data.departmentId }
      })
      
      if (!department) {
        throw new Error('Reparto non trovato')
      }

      // Validazione transizione di stato
      const isValidTransition = data.eventType === EventType.ENTRY
        ? isValidDepartmentEntry(odl.status, department.type)
        : isValidDepartmentExit(odl.status, department.type)
      
      if (!isValidTransition) {
        const errorMessage = data.eventType === EventType.ENTRY
          ? getTransitionErrorMessage(odl.status, this.getTargetStatusForEntry(department.type))
          : getTransitionErrorMessage(odl.status, this.getTargetStatusForExit(department.type))
        throw new Error(`Transizione di stato non valida: ${errorMessage}`)
      }

      // Crea l'evento
      const event = await tx.productionEvent.create({
        data: {
          odlId: data.odlId,
          departmentId: data.departmentId,
          eventType: data.eventType,
          userId: data.userId,
          notes: data.notes,
          duration: data.duration,
        },
        include: {
          user: true,
          department: true,
          odl: {
            include: { part: true }
          }
        }
      })

      // Aggiorna lo stato dell'ODL atomicamente
      await this.updateODLStatusWithinTransaction(tx, odl.id, data.departmentId, data.eventType)

      return event as ProductionEventResponse
    }, {
      isolationLevel: 'ReadCommitted',
      timeout: 10000
    }).then(async (event) => {
      // Post-processing fuori dalla transazione per evitare timeout
      try {
        await TimeMetricsService.processProductionEvent(event)
      } catch (error) {
        console.error('Errore calcolo metriche temporali:', error)
      }

      // Attiva trasferimento automatico se EXIT
      if (data.eventType === EventType.EXIT) {
        try {
          await WorkflowService.executeAutoTransfer({
            odlId: data.odlId,
            currentDepartmentId: data.departmentId,
            userId: data.userId
          })
        } catch (error) {
          console.error('Auto transfer failed:', error)
        }
      }

      return event
      })
    }, 'createProductionEvent')
  }

  // Aggiorna lo stato dell'ODL in base agli eventi (dentro transazione)
  private static async updateODLStatusWithinTransaction(tx: any, odlId: string, departmentId: string, eventType: EventType) {
    const department = await tx.department.findUnique({
      where: { id: departmentId }
    })

    if (!department) return

    let newStatus: ODLStatus | null = null

    // Logica per determinare il nuovo stato basato su reparto ed evento
    if (eventType === EventType.ENTRY) {
      switch (department.type) {
        case 'HONEYCOMB':
          newStatus = ODLStatus.IN_HONEYCOMB
          break
        case 'CLEANROOM':
          newStatus = ODLStatus.IN_CLEANROOM
          break
        case 'AUTOCLAVE':
          newStatus = ODLStatus.IN_AUTOCLAVE
          break
        case 'CONTROLLO_NUMERICO':
          newStatus = ODLStatus.IN_CONTROLLO_NUMERICO
          break
        case 'NDI':
          newStatus = ODLStatus.IN_NDI
          break
        case 'MONTAGGIO':
          newStatus = ODLStatus.IN_MONTAGGIO
          break
        case 'VERNICIATURA':
          newStatus = ODLStatus.IN_VERNICIATURA
          break
        case 'CONTROLLO_QUALITA':
          newStatus = ODLStatus.IN_CONTROLLO_QUALITA
          break
      }
    } else if (eventType === EventType.EXIT) {
      switch (department.type) {
        case 'HONEYCOMB':
          newStatus = ODLStatus.HONEYCOMB_COMPLETED
          break
        case 'CLEANROOM':
          newStatus = ODLStatus.CLEANROOM_COMPLETED
          break
        case 'AUTOCLAVE':
          newStatus = ODLStatus.AUTOCLAVE_COMPLETED
          break
        case 'CONTROLLO_NUMERICO':
          newStatus = ODLStatus.CONTROLLO_NUMERICO_COMPLETED
          break
        case 'NDI':
          newStatus = ODLStatus.NDI_COMPLETED
          break
        case 'MONTAGGIO':
          newStatus = ODLStatus.MONTAGGIO_COMPLETED
          break
        case 'VERNICIATURA':
          newStatus = ODLStatus.VERNICIATURA_COMPLETED
          break
        case 'CONTROLLO_QUALITA':
          newStatus = ODLStatus.COMPLETED
          break
      }
    }

    if (newStatus) {
      await tx.oDL.update({
        where: { id: odlId },
        data: { status: newStatus }
      })
    }
  }

  // Aggiorna lo stato dell'ODL in base agli eventi (legacy - per compatibilità)
  private static async updateODLStatus(odlId: string, departmentId: string, eventType: EventType) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    })

    if (!department) return

    let newStatus: ODLStatus | null = null

    // Logica per determinare il nuovo stato basato su reparto ed evento
    if (eventType === EventType.ENTRY) {
      switch (department.type) {
        case 'HONEYCOMB':
          newStatus = ODLStatus.IN_HONEYCOMB
          break
        case 'CLEANROOM':
          newStatus = ODLStatus.IN_CLEANROOM
          break
        case 'AUTOCLAVE':
          newStatus = ODLStatus.IN_AUTOCLAVE
          break
        case 'CONTROLLO_NUMERICO':
          newStatus = ODLStatus.IN_CONTROLLO_NUMERICO
          break
        case 'NDI':
          newStatus = ODLStatus.IN_NDI
          break
        case 'MONTAGGIO':
          newStatus = ODLStatus.IN_MONTAGGIO
          break
        case 'VERNICIATURA':
          newStatus = ODLStatus.IN_VERNICIATURA
          break
        case 'CONTROLLO_QUALITA':
          newStatus = ODLStatus.IN_CONTROLLO_QUALITA
          break
      }
    } else if (eventType === EventType.EXIT) {
      switch (department.type) {
        case 'HONEYCOMB':
          newStatus = ODLStatus.HONEYCOMB_COMPLETED
          break
        case 'CLEANROOM':
          newStatus = ODLStatus.CLEANROOM_COMPLETED
          break
        case 'AUTOCLAVE':
          newStatus = ODLStatus.AUTOCLAVE_COMPLETED
          break
        case 'CONTROLLO_NUMERICO':
          newStatus = ODLStatus.CONTROLLO_NUMERICO_COMPLETED
          break
        case 'NDI':
          newStatus = ODLStatus.NDI_COMPLETED
          break
        case 'MONTAGGIO':
          newStatus = ODLStatus.MONTAGGIO_COMPLETED
          break
        case 'VERNICIATURA':
          newStatus = ODLStatus.VERNICIATURA_COMPLETED
          break
        case 'CONTROLLO_QUALITA':
          newStatus = ODLStatus.COMPLETED
          break
      }
    }

    if (newStatus) {
      await prisma.oDL.update({
        where: { id: odlId },
        data: { status: newStatus }
      })
    }
  }

  // Ottieni eventi di produzione con filtri
  static async getProductionEvents(filter: ProductionEventFilter): Promise<ProductionEventResponse[]> {
    const where: Prisma.ProductionEventWhereInput = {}
    
    if (filter.odlId) where.odlId = filter.odlId
    if (filter.departmentId) where.departmentId = filter.departmentId
    if (filter.eventType) where.eventType = filter.eventType
    if (filter.fromDate || filter.toDate) {
      where.timestamp = {
        gte: filter.fromDate,
        lte: filter.toDate
      }
    }

    const events = await prisma.productionEvent.findMany({
      where,
      include: {
        user: true,
        department: true,
        odl: {
          include: { part: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: filter.limit,
      skip: filter.offset
    })

    return events as ProductionEventResponse[]
  }

  // Ottieni stato tracking di un ODL
  static async getODLTrackingStatus(odlId: string): Promise<ODLTrackingStatus | null> {
    const odl = await prisma.oDL.findUnique({
      where: { id: odlId },
      include: {
        part: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: {
            department: true,
            user: true
          }
        }
      }
    })

    if (!odl) return null

    const lastEvent = odl.events[0] || null
    
    // Calcola tempo nel reparto corrente
    let timeInCurrentDepartment = null
    let currentDepartment = null
    
    if (lastEvent && lastEvent.eventType === EventType.ENTRY) {
      currentDepartment = lastEvent.department
      const now = new Date()
      timeInCurrentDepartment = Math.floor((now.getTime() - lastEvent.timestamp.getTime()) / 1000 / 60)
    }

    // Calcola tempo totale di produzione
    const productionEvents = await prisma.productionEvent.findMany({
      where: { odlId },
      orderBy: { timestamp: 'asc' }
    })

    let totalProductionTime = 0
    let entryTime: Date | null = null

    for (const event of productionEvents) {
      if (event.eventType === EventType.ENTRY) {
        entryTime = event.timestamp
      } else if (event.eventType === EventType.EXIT && entryTime) {
        totalProductionTime += Math.floor((event.timestamp.getTime() - entryTime.getTime()) / 1000 / 60)
        entryTime = null
      }
    }

    // Se ancora in lavorazione, aggiungi il tempo corrente
    if (entryTime) {
      totalProductionTime += Math.floor((new Date().getTime() - entryTime.getTime()) / 1000 / 60)
    }

    return {
      id: odl.id,
      odlNumber: odl.odlNumber,
      qrCode: odl.qrCode,
      status: odl.status,
      priority: odl.priority,
      quantity: odl.quantity,
      part: {
        partNumber: odl.part.partNumber,
        description: odl.part.description
      },
      currentDepartment,
      lastEvent: lastEvent ? {
        ...lastEvent,
        notes: lastEvent.notes || undefined,
        duration: lastEvent.duration || undefined,
        odl: {
          id: odl.id,
          odlNumber: odl.odlNumber,
          status: odl.status,
          part: odl.part
        }
      } : null,
      timeInCurrentDepartment,
      totalProductionTime
    }
  }

  // Ottieni lista ODL per reparto
  static async getDepartmentODLList(departmentId: string): Promise<DepartmentODLList> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    })

    if (!department) {
      throw new Error('Reparto non trovato')
    }

    // ODL con ultimo evento in questo reparto
    const odlsWithEvents = await prisma.oDL.findMany({
      where: {
        events: {
          some: {
            departmentId
          }
        }
      },
      include: {
        part: true,
        events: {
          where: { departmentId },
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: {
            department: true,
            user: true
          }
        }
      }
    })

    // ODL pronti per questo reparto (completati dal reparto precedente o CREATED per primo reparto)
    const readyODLs = await this.getODLsReadyForDepartment(department.type)

    // ODL in arrivo dal reparto precedente (non ancora entrati)
    const incomingODLs = await this.getIncomingODLsFromPreviousDepartment(department.type)

    const odlIncoming: ODLTrackingStatus[] = []
    const odlInPreparation: ODLTrackingStatus[] = []
    const odlInProduction: ODLTrackingStatus[] = []
    const odlCompleted: ODLTrackingStatus[] = []

    // Aggiungi ODL in arrivo dal reparto precedente
    for (const incomingODL of incomingODLs) {
      const trackingStatus = await this.getODLTrackingStatus(incomingODL.id)
      if (trackingStatus) {
        odlIncoming.push(trackingStatus)
      }
    }

    // Aggiungi ODL pronti per questo reparto alla preparazione
    for (const readyODL of readyODLs) {
      const trackingStatus = await this.getODLTrackingStatus(readyODL.id)
      if (trackingStatus) {
        odlInPreparation.push(trackingStatus)
      }
    }

    // Classifica gli ODL che hanno già eventi in questo reparto
    for (const odl of odlsWithEvents) {
      const trackingStatus = await this.getODLTrackingStatus(odl.id)
      if (!trackingStatus) continue

      const lastEvent = odl.events[0]
      
      if (!lastEvent) {
        // Verifica se non è già stato aggiunto come "ready"
        if (!readyODLs.find(ready => ready.id === odl.id)) {
          odlInPreparation.push(trackingStatus)
        }
      } else if (lastEvent.eventType === EventType.ENTRY) {
        odlInProduction.push(trackingStatus)
      } else if (lastEvent.eventType === EventType.EXIT) {
        // Verifica se ODL è già progredito oltre questo reparto
        const hasProgressedBeyond = await this.hasODLProgressedBeyondDepartment(odl, department.type)
        
        // Mostra in "completati" solo se non è ancora progredito al reparto successivo
        if (!hasProgressedBeyond) {
          odlCompleted.push(trackingStatus)
        }
      } else {
        // Verifica se non è già stato aggiunto come "ready"
        if (!readyODLs.find(ready => ready.id === odl.id)) {
          odlInPreparation.push(trackingStatus)
        }
      }
    }

    // Calcola statistiche
    const totalActive = odlInPreparation.length + odlInProduction.length
    const avgCycleTime = odlCompleted.length > 0
      ? odlCompleted.reduce((sum, odl) => sum + (odl.timeInCurrentDepartment || 0), 0) / odlCompleted.length
      : 0
    
    // Calcolo efficienza basato su ODL completati vs totali attivi
    const efficiency = totalActive > 0 ? 
      Math.min(100, Math.round((odlCompleted.length / totalActive) * 100 * 10) / 10) : 0

    return {
      departmentId,
      odlIncoming,
      odlInPreparation,
      odlInProduction,
      odlCompleted,
      statistics: {
        totalActive,
        avgCycleTime: Math.round(avgCycleTime),
        efficiency: Math.round(efficiency)
      }
    }
  }

  /**
   * Verifica se un ODL è progredito oltre il reparto specificato nel workflow
   * Un ODL è considerato "progredito oltre" solo se ha un evento ENTRY nel reparto successivo
   */
  private static async hasODLProgressedBeyondDepartment(
    odl: any, 
    currentDepartmentType: string
  ): Promise<boolean> {
    // Definisce la sequenza del workflow
    const workflowSequence = [
      'CLEANROOM',
      'AUTOCLAVE', 
      'CONTROLLO_NUMERICO',
      'NDI',
      'MONTAGGIO',
      'VERNICIATURA',
      'CONTROLLO_QUALITA'
    ]

    // Trova la posizione del reparto corrente nel workflow
    const currentPosition = workflowSequence.indexOf(currentDepartmentType)
    if (currentPosition === -1) {
      // Se il reparto non è nel workflow principale (es. HONEYCOMB, MOTORI), non nascondere
      return false
    }

    // Se è l'ultimo reparto nel workflow, non può progredire oltre
    if (currentPosition === workflowSequence.length - 1) {
      return false
    }

    // Identifica i reparti successivi nel workflow
    const nextDepartments = workflowSequence.slice(currentPosition + 1)

    // Verifica se esiste un evento ENTRY in uno qualsiasi dei reparti successivi
    const hasEntryInNextDepartments = await prisma.productionEvent.findFirst({
      where: {
        odlId: odl.id,
        eventType: EventType.ENTRY,
        department: {
          type: {
            in: nextDepartments as any[]
          }
        }
      }
    })

    // L'ODL è progredito oltre solo se ha effettivamente iniziato la lavorazione
    // (evento ENTRY) in un reparto successivo nel workflow
    return !!hasEntryInNextDepartments
  }

  /**
   * Trova ODL attualmente in lavorazione nel reparto precedente
   * NON include ODL completati (che sono già passati allo stato di preparazione del reparto corrente)
   * Include solo ODL con ultimo evento ENTRY (non EXIT) nel reparto precedente
   */
  private static async getIncomingODLsFromPreviousDepartment(departmentType: string): Promise<any[]> {
    // Definisce la sequenza del workflow
    const workflowSequence = [
      'CLEANROOM',
      'AUTOCLAVE', 
      'CONTROLLO_NUMERICO',
      'NDI',
      'MONTAGGIO',
      'VERNICIATURA',
      'CONTROLLO_QUALITA'
    ]

    const departmentPosition = workflowSequence.indexOf(departmentType)
    
    // Se è il primo reparto o non nel workflow, non ha ODL in arrivo
    if (departmentPosition <= 0) {
      return []
    }

    // Identifica il reparto precedente
    const previousDepartment = workflowSequence[departmentPosition - 1]
    
    // Trova tutti i dipartimenti di tipo previousDepartment
    const previousDepartments = await prisma.department.findMany({
      where: {
        type: previousDepartment as any,
        isActive: true
      }
    })
    
    if (previousDepartments.length === 0) {
      return []
    }
    
    const previousDepartmentIds = previousDepartments.map(d => d.id)
    
    // Mappa stati "in lavorazione" per ogni reparto
    const inProcessStates: Record<string, string> = {
      'CLEANROOM': 'IN_CLEANROOM',
      'AUTOCLAVE': 'IN_AUTOCLAVE',
      'CONTROLLO_NUMERICO': 'IN_CONTROLLO_NUMERICO',
      'NDI': 'IN_NDI',
      'MONTAGGIO': 'IN_MONTAGGIO',
      'VERNICIATURA': 'IN_VERNICIATURA',
      'CONTROLLO_QUALITA': 'IN_CONTROLLO_QUALITA'
    }
    
    const previousDepartmentInProcessStatus = inProcessStates[previousDepartment]
    
    // Trova ODL che sono attualmente IN LAVORAZIONE nel reparto precedente
    // Non include ODL completati perché quelli sono già passati al reparto successivo
    const incomingODLs = await prisma.oDL.findMany({
      where: {
        status: previousDepartmentInProcessStatus as any,
        // Assicurati che abbiano almeno un evento ENTRY nel reparto precedente
        events: {
          some: {
            eventType: EventType.ENTRY,
            departmentId: {
              in: previousDepartmentIds
            }
          }
        }
      },
      include: {
        part: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: {
            department: true,
            user: true
          }
        }
      }
    })

    return incomingODLs
  }

  /**
   * Ottiene lo stato target per un evento ENTRY in un reparto
   */
  private static getTargetStatusForEntry(departmentType: string): ODLStatus {
    const statusMap: Record<string, ODLStatus> = {
      'CLEANROOM': ODLStatus.IN_CLEANROOM,
      'AUTOCLAVE': ODLStatus.IN_AUTOCLAVE,
      'HONEYCOMB': ODLStatus.IN_HONEYCOMB,
      'CONTROLLO_NUMERICO': ODLStatus.IN_CONTROLLO_NUMERICO,
      'NDI': ODLStatus.IN_NDI,
      'MONTAGGIO': ODLStatus.IN_MONTAGGIO,
      'VERNICIATURA': ODLStatus.IN_VERNICIATURA,
      'CONTROLLO_QUALITA': ODLStatus.IN_CONTROLLO_QUALITA
    }
    return statusMap[departmentType] || ODLStatus.IN_CLEANROOM
  }

  /**
   * Ottiene lo stato target per un evento EXIT in un reparto
   */
  private static getTargetStatusForExit(departmentType: string): ODLStatus {
    const statusMap: Record<string, ODLStatus> = {
      'CLEANROOM': ODLStatus.CLEANROOM_COMPLETED,
      'AUTOCLAVE': ODLStatus.AUTOCLAVE_COMPLETED,
      'HONEYCOMB': ODLStatus.HONEYCOMB_COMPLETED,
      'CONTROLLO_NUMERICO': ODLStatus.CONTROLLO_NUMERICO_COMPLETED,
      'NDI': ODLStatus.NDI_COMPLETED,
      'MONTAGGIO': ODLStatus.MONTAGGIO_COMPLETED,
      'VERNICIATURA': ODLStatus.VERNICIATURA_COMPLETED,
      'CONTROLLO_QUALITA': ODLStatus.COMPLETED
    }
    return statusMap[departmentType] || ODLStatus.CLEANROOM_COMPLETED
  }

  /**
   * Trova ODL pronti per iniziare lavorazione in un reparto specifico
   */
  private static async getODLsReadyForDepartment(departmentType: string): Promise<any[]> {
    // Definisce la sequenza del workflow
    const workflowSequence = [
      'CLEANROOM',
      'AUTOCLAVE', 
      'CONTROLLO_NUMERICO',
      'NDI',
      'MONTAGGIO',
      'VERNICIATURA',
      'CONTROLLO_QUALITA'
    ]

    const departmentPosition = workflowSequence.indexOf(departmentType)
    
    let readyStatuses: string[] = []

    if (departmentPosition === 0) {
      // Primo reparto: accetta ODL CREATED
      readyStatuses = ['CREATED']
    } else if (departmentPosition > 0) {
      // Reparti successivi: accetta ODL completati dal reparto precedente
      const previousDepartment = workflowSequence[departmentPosition - 1]
      readyStatuses = [`${previousDepartment}_COMPLETED`]
    } else {
      // Reparti speciali (HONEYCOMB, MOTORI): accetta CREATED
      readyStatuses = ['CREATED']
    }

    // Cerca ODL con stati appropriati che NON hanno ancora eventi in questo reparto
    const readyODLs = await prisma.oDL.findMany({
      where: {
        status: {
          in: readyStatuses as any[]
        },
        // Escludi ODL che hanno già eventi in questo reparto
        events: {
          none: {
            department: {
              type: departmentType as any
            }
          }
        }
      },
      include: {
        part: true
      }
    })

    return readyODLs
  }
}