import { EventType, ODLStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { WorkflowService } from './WorkflowService'
import { TimeMetricsService } from './TimeMetricsService'
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
    // Verifica che l'ODL esista
    const odl = await prisma.oDL.findUnique({
      where: { id: data.odlId },
      include: { part: true }
    })
    
    if (!odl) {
      throw new Error('ODL non trovato')
    }

    // Crea l'evento
    const event = await prisma.productionEvent.create({
      data: {
        odlId: data.odlId,
        departmentId: data.departmentId,
        eventType: data.eventType,
        userId: data.userId,
        notes: data.notes,
        duration: data.duration, // Supporto per durata timer
      },
      include: {
        user: true,
        department: true,
        odl: {
          include: { part: true }
        }
      }
    })

    // Aggiorna lo stato dell'ODL in base all'evento
    await this.updateODLStatus(odl.id, data.departmentId, data.eventType)

    // 🆕 EVENT-DRIVEN HOOK: Calcola metriche temporali
    try {
      await TimeMetricsService.processProductionEvent(event as ProductionEventResponse)
    } catch (error) {
      console.error('Errore calcolo metriche temporali:', error)
      // Non bloccare il flusso principale per errori di calcolo metriche
    }

    // Attiva trasferimento automatico se EXIT
    if (data.eventType === EventType.EXIT) {
      try {
        const transferResult = await WorkflowService.executeAutoTransfer({
          odlId: data.odlId,
          currentDepartmentId: data.departmentId,
          userId: data.userId
        });
        
        // Transfer result logged internally by WorkflowService
      } catch (error) {
        console.error('Auto transfer failed:', error);
        // Non bloccare l'evento per errori di trasferimento
      }
    }

    return event as ProductionEventResponse
  }

  // Aggiorna lo stato dell'ODL in base agli eventi
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

    const odlInPreparation: ODLTrackingStatus[] = []
    const odlInProduction: ODLTrackingStatus[] = []
    const odlCompleted: ODLTrackingStatus[] = []

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

    // Verifica lo stato attuale dell'ODL
    const currentODL = await prisma.oDL.findUnique({
      where: { id: odl.id },
      select: { status: true }
    })

    if (!currentODL) return false

    // Mappa gli stati ODL alle posizioni del workflow
    const statusToPosition: Record<string, number> = {
      'CREATED': -1,
      'IN_CLEANROOM': 0,
      'CLEANROOM_COMPLETED': 0,
      'IN_AUTOCLAVE': 1,
      'AUTOCLAVE_COMPLETED': 1,
      'IN_CONTROLLO_NUMERICO': 2,
      'CONTROLLO_NUMERICO_COMPLETED': 2,
      'IN_NDI': 3,
      'NDI_COMPLETED': 3,
      'IN_MONTAGGIO': 4,
      'MONTAGGIO_COMPLETED': 4,
      'IN_VERNICIATURA': 5,
      'VERNICIATURA_COMPLETED': 5,
      'IN_CONTROLLO_QUALITA': 6,
      'CONTROLLO_QUALITA_COMPLETED': 6,
      'COMPLETED': 7
    }

    const odlCurrentPosition = statusToPosition[currentODL.status] ?? -1
    
    // L'ODL è progredito oltre se la sua posizione corrente è maggiore 
    // della posizione del reparto che stiamo visualizzando
    return odlCurrentPosition > currentPosition
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