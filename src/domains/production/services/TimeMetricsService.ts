import { EventType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ProductionEventResponse } from '../schemas/tracking.schema'

export interface ODLTimeAnalysis {
  odlId: string
  odlNumber: string
  partNumber: string
  departmentTimes: DepartmentTimeData[]
  totalTime: number
}

export interface PartTimeAnalysis {
  partNumber: string
  partDescription: string
  odlCount: number
  avgDepartmentTimes: DepartmentTimeData[]
  avgTotalTime: number
}

export interface DepartmentTimeData {
  departmentId: string
  departmentName: string
  departmentCode: string
  advancementTime: number | null // minuti
  workingTime: number | null     // minuti (senza pause)
  waitingTime: number | null     // minuti attesa prossimo reparto
}

export class TimeMetricsService {
  /**
   * Hook principale chiamato da TrackingService dopo ogni evento di produzione
   */
  static async processProductionEvent(event: ProductionEventResponse): Promise<void> {
    try {
      switch (event.eventType) {
        case EventType.ENTRY:
          await this.handleEntryEvent(event)
          break
        case EventType.EXIT:
          await this.handleExitEvent(event)
          break
        case EventType.PAUSE:
          await this.handlePauseEvent(event)
          break
        case EventType.RESUME:
          await this.handleResumeEvent(event)
          break
        case EventType.NOTE:
          // NOTE non influenza i calcoli temporali
          break
      }
    } catch (error) {
      console.error('Errore processamento evento per TimeMetrics:', error)
      // Non bloccare il flusso principale per errori di calcolo metriche
    }
  }

  /**
   * Gestisce evento ENTRY: calcola waiting time e crea/aggiorna record TimeMetrics
   */
  private static async handleEntryEvent(event: ProductionEventResponse): Promise<void> {
    // Calcola tempo di attesa dal reparto precedente
    const waitingTime = await this.calculateWaitingTime(event.odl.id, event.departmentId, event.timestamp)
    
    // Crea o aggiorna record TimeMetrics per questo ODL×Reparto
    await prisma.timeMetrics.upsert({
      where: {
        odlId_departmentId: {
          odlId: event.odl.id,
          departmentId: event.departmentId
        }
      },
      update: {
        entryTimestamp: event.timestamp,
        waitingTime,
        isCompleted: false,
        updatedAt: new Date()
      },
      create: {
        odlId: event.odl.id,
        departmentId: event.departmentId,
        entryTimestamp: event.timestamp,
        waitingTime,
        isCompleted: false
      }
    })
  }

  /**
   * Gestisce evento EXIT: calcola advancement/working time e aggiorna statistiche Part
   */
  private static async handleExitEvent(event: ProductionEventResponse): Promise<void> {
    const timeMetric = await prisma.timeMetrics.findUnique({
      where: {
        odlId_departmentId: {
          odlId: event.odl.id,
          departmentId: event.departmentId
        }
      }
    })

    if (!timeMetric || !timeMetric.entryTimestamp) {
      console.warn(`TimeMetrics mancante per ODL ${event.odl.odlNumber} in reparto ${event.departmentId}`)
      return
    }

    // Calcola advancement time (tempo totale ENTRY → EXIT)
    const advancementTime = Math.floor(
      (event.timestamp.getTime() - timeMetric.entryTimestamp.getTime()) / 1000 / 60
    )

    // Calcola working time (advancement - pause)
    const workingTime = Math.max(0, advancementTime - timeMetric.pauseDuration)

    // Aggiorna record TimeMetrics
    await prisma.timeMetrics.update({
      where: {
        odlId_departmentId: {
          odlId: event.odl.id,
          departmentId: event.departmentId
        }
      },
      data: {
        exitTimestamp: event.timestamp,
        advancementTime,
        workingTime,
        isCompleted: true,
        updatedAt: new Date()
      }
    })

    // Aggiorna statistiche aggregate per Part Number
    // Recupera l'ID del part dal partNumber perché l'evento contiene solo partNumber
    const part = await prisma.part.findUnique({
      where: { partNumber: event.odl.part.partNumber },
      select: { id: true }
    })
    
    if (part) {
      await this.updatePartTimeStatistics(part.id, event.departmentId, {
        advancementTime,
        workingTime,
        waitingTime: timeMetric.waitingTime
      })
    }
  }

  /**
   * Gestisce evento PAUSE: inizia tracking pausa
   */
  private static async handlePauseEvent(event: ProductionEventResponse): Promise<void> {
    // Memorizza timestamp di inizio pausa per calcolare durata al RESUME
    await prisma.timeMetrics.upsert({
      where: {
        odlId_departmentId: {
          odlId: event.odl.id,
          departmentId: event.departmentId
        }
      },
      update: {
        // Salviamo il timestamp di pausa in un campo temporaneo (useremo notes per semplicità)
        updatedAt: new Date()
      },
      create: {
        odlId: event.odl.id,
        departmentId: event.departmentId
      }
    })
  }

  /**
   * Gestisce evento RESUME: calcola durata pausa e aggiorna totale
   */
  private static async handleResumeEvent(event: ProductionEventResponse): Promise<void> {
    // Trova l'ultimo evento PAUSE per questo ODL in questo reparto
    const lastPauseEvent = await prisma.productionEvent.findFirst({
      where: {
        odlId: event.odl.id,
        departmentId: event.departmentId,
        eventType: EventType.PAUSE,
        timestamp: {
          lt: event.timestamp
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (lastPauseEvent) {
      // Calcola durata pausa in minuti
      const pauseDuration = Math.floor(
        (event.timestamp.getTime() - lastPauseEvent.timestamp.getTime()) / 1000 / 60
      )

      // Aggiorna pauseDuration totale
      await prisma.timeMetrics.upsert({
        where: {
          odlId_departmentId: {
            odlId: event.odl.id,
            departmentId: event.departmentId
          }
        },
        update: {
          pauseDuration: {
            increment: pauseDuration
          },
          updatedAt: new Date()
        },
        create: {
          odlId: event.odl.id,
          departmentId: event.departmentId,
          pauseDuration
        }
      })
    }
  }

  /**
   * Calcola tempo di attesa dal reparto precedente
   */
  private static async calculateWaitingTime(
    odlId: string, 
    currentDepartmentId: string, 
    entryTimestamp: Date
  ): Promise<number | null> {
    // Trova l'ultimo evento EXIT prima di questo ENTRY
    const lastExitEvent = await prisma.productionEvent.findFirst({
      where: {
        odlId,
        eventType: EventType.EXIT,
        timestamp: {
          lt: entryTimestamp
        },
        departmentId: {
          not: currentDepartmentId // Escludi lo stesso reparto
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (!lastExitEvent) {
      return null // Primo reparto, nessun tempo di attesa
    }

    // Calcola tempo di attesa in minuti
    return Math.floor(
      (entryTimestamp.getTime() - lastExitEvent.timestamp.getTime()) / 1000 / 60
    )
  }

  /**
   * Aggiorna statistiche aggregate per Part Number
   */
  private static async updatePartTimeStatistics(
    partId: string,
    departmentId: string,
    newTimes: {
      advancementTime: number
      workingTime: number
      waitingTime: number | null
    }
  ): Promise<void> {
    // Prima recupera i dati esistenti
    const existing = await prisma.partTimeStatistics.findUnique({
      where: {
        partId_departmentId: {
          partId,
          departmentId
        }
      }
    })

    if (existing) {
      // Aggiorna con incrementi e ricalcola medie
      const newCount = existing.completedODLCount + 1
      const newTotalAdvancement = existing.totalAdvancementTime + newTimes.advancementTime
      const newTotalWorking = existing.totalWorkingTime + newTimes.workingTime
      const newTotalWaiting = existing.totalWaitingTime + (newTimes.waitingTime || 0)

      await prisma.partTimeStatistics.update({
        where: {
          partId_departmentId: {
            partId,
            departmentId
          }
        },
        data: {
          completedODLCount: newCount,
          totalAdvancementTime: newTotalAdvancement,
          totalWorkingTime: newTotalWorking,
          totalWaitingTime: newTotalWaiting,
          avgAdvancementTime: newTotalAdvancement / newCount,
          avgWorkingTime: newTotalWorking / newCount,
          avgWaitingTime: newTotalWaiting / newCount
        }
      })
    } else {
      // Crea nuovo record
      await prisma.partTimeStatistics.create({
        data: {
          partId,
          departmentId,
          completedODLCount: 1,
          totalAdvancementTime: newTimes.advancementTime,
          totalWorkingTime: newTimes.workingTime,
          totalWaitingTime: newTimes.waitingTime || 0,
          avgAdvancementTime: newTimes.advancementTime,
          avgWorkingTime: newTimes.workingTime,
          avgWaitingTime: newTimes.waitingTime
        }
      })
    }
  }

  /**
   * API: Ottieni analisi temporale per un singolo ODL
   */
  static async getODLTimeAnalysis(odlId: string): Promise<ODLTimeAnalysis | null> {
    const odl = await prisma.oDL.findUnique({
      where: { id: odlId },
      include: {
        part: true,
        timeMetrics: {
          include: {
            department: true
          },
          orderBy: {
            entryTimestamp: 'asc'
          }
        }
      }
    })

    if (!odl) {
      return null
    }

    const departmentTimes: DepartmentTimeData[] = odl.timeMetrics.map(metric => ({
      departmentId: metric.departmentId,
      departmentName: metric.department.name,
      departmentCode: metric.department.code,
      advancementTime: metric.advancementTime,
      workingTime: metric.workingTime,
      waitingTime: metric.waitingTime
    }))

    const totalTime = departmentTimes.reduce((sum, dept) => {
      return sum + (dept.advancementTime || 0) + (dept.waitingTime || 0)
    }, 0)

    return {
      odlId: odl.id,
      odlNumber: odl.odlNumber,
      partNumber: odl.part.partNumber,
      departmentTimes,
      totalTime
    }
  }

  /**
   * API: Ottieni analisi temporale aggregata per Part Number
   */
  static async getPartTimeAnalysis(partNumber: string): Promise<PartTimeAnalysis | null> {
    const part = await prisma.part.findUnique({
      where: { partNumber },
      include: {
        timeStatistics: {
          include: {
            department: true
          }
        },
        odls: {
          select: { id: true }
        }
      }
    })

    if (!part) {
      return null
    }

    const avgDepartmentTimes: DepartmentTimeData[] = part.timeStatistics.map(stat => ({
      departmentId: stat.departmentId,
      departmentName: stat.department.name,
      departmentCode: stat.department.code,
      advancementTime: stat.avgAdvancementTime,
      workingTime: stat.avgWorkingTime,
      waitingTime: stat.avgWaitingTime
    }))

    const avgTotalTime = avgDepartmentTimes.reduce((sum, dept) => {
      return sum + (dept.advancementTime || 0) + (dept.waitingTime || 0)
    }, 0)

    return {
      partNumber: part.partNumber,
      partDescription: part.description,
      odlCount: part.odls.length,
      avgDepartmentTimes,
      avgTotalTime
    }
  }

  /**
   * API: Lista ODL con analisi temporale per dashboard
   */
  static async getODLTimeAnalysisList(limit = 50, offset = 0): Promise<ODLTimeAnalysis[]> {
    const odls = await prisma.oDL.findMany({
      take: limit,
      skip: offset,
      include: {
        part: true,
        timeMetrics: {
          include: {
            department: true
          },
          orderBy: {
            entryTimestamp: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return odls.map(odl => {
      const departmentTimes: DepartmentTimeData[] = odl.timeMetrics.map(metric => ({
        departmentId: metric.departmentId,
        departmentName: metric.department.name,
        departmentCode: metric.department.code,
        advancementTime: metric.advancementTime,
        workingTime: metric.workingTime,
        waitingTime: metric.waitingTime
      }))

      const totalTime = departmentTimes.reduce((sum, dept) => {
        return sum + (dept.advancementTime || 0) + (dept.waitingTime || 0)
      }, 0)

      return {
        odlId: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        departmentTimes,
        totalTime
      }
    })
  }

  /**
   * API: Lista Part Number con analisi temporale aggregata
   */
  static async getPartTimeAnalysisList(): Promise<PartTimeAnalysis[]> {
    const parts = await prisma.part.findMany({
      include: {
        timeStatistics: {
          include: {
            department: true
          }
        },
        odls: {
          select: { id: true }
        }
      },
      where: {
        timeStatistics: {
          some: {} // Solo parts con statistiche temporali
        }
      }
    })

    return parts.map(part => {
      const avgDepartmentTimes: DepartmentTimeData[] = part.timeStatistics.map(stat => ({
        departmentId: stat.departmentId,
        departmentName: stat.department.name,
        departmentCode: stat.department.code,
        advancementTime: stat.avgAdvancementTime,
        workingTime: stat.avgWorkingTime,
        waitingTime: stat.avgWaitingTime
      }))

      const avgTotalTime = avgDepartmentTimes.reduce((sum, dept) => {
        return sum + (dept.advancementTime || 0) + (dept.waitingTime || 0)
      }, 0)

      return {
        partNumber: part.partNumber,
        partDescription: part.description,
        odlCount: part.odls.length,
        avgDepartmentTimes,
        avgTotalTime
      }
    })
  }
}