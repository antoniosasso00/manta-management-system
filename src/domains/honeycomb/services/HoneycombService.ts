import { prisma } from '@/lib/prisma'
import {
  HoneycombConfigurationCreate,
  HoneycombConfigurationUpdate,
  HoneycombConfigurationFilter,
  HoneycombProcessCreate,
  HoneycombProcessStart,
  HoneycombProcessComplete,
  HoneycombProcessUpdate,
  HoneycombProcessFilter,
  HoneycombStatsFilter,
  PaginationParams,
} from '../schemas/honeycombSchemas'
import { ProcessStatus, HoneycombProcessType, QualityResult } from '@prisma/client'

export class HoneycombService {
  // ==================== CONFIGURATION MANAGEMENT ====================
  
  static async createConfiguration(data: HoneycombConfigurationCreate) {
    // Verifica che la parte esista
    const part = await prisma.part.findUnique({
      where: { id: data.partId },
    })

    if (!part) {
      throw new Error('Parte non trovata')
    }

    // Verifica che non esista già una configurazione per questa parte
    const existingConfig = await prisma.honeycombConfiguration.findUnique({
      where: { partId: data.partId },
    })

    if (existingConfig) {
      throw new Error('Configurazione honeycomb già esistente per questa parte')
    }

    return await prisma.honeycombConfiguration.create({
      data,
      include: {
        part: true,
        _count: {
          select: { processes: true },
        },
      },
    })
  }

  static async findConfigurationById(id: string) {
    return await prisma.honeycombConfiguration.findUnique({
      where: { id },
      include: {
        part: true,
        processes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            odl: {
              select: { id: true, odlNumber: true },
            },
            operator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { processes: true },
        },
      },
    })
  }

  static async findManyConfigurations(
    filters: HoneycombConfigurationFilter,
    pagination: PaginationParams
  ) {
    const { page, limit } = pagination
    const where: any = {}

    // Apply filters
    if (filters.partId) {
      where.partId = filters.partId
    }

    if (filters.coreType) {
      where.coreType = filters.coreType
    }

    if (filters.search) {
      where.OR = [
        { adhesiveType: { contains: filters.search, mode: 'insensitive' } },
        { skinMaterial: { contains: filters.search, mode: 'insensitive' } },
        { part: { partNumber: { contains: filters.search, mode: 'insensitive' } } },
        { part: { description: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const [configurations, total] = await Promise.all([
      prisma.honeycombConfiguration.findMany({
        where,
        include: {
          part: true,
          _count: {
            select: { processes: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.honeycombConfiguration.count({ where }),
    ])

    return {
      configurations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateConfiguration(id: string, data: HoneycombConfigurationUpdate) {
    return await prisma.honeycombConfiguration.update({
      where: { id },
      data,
      include: {
        part: true,
      },
    })
  }

  static async deleteConfiguration(id: string) {
    return await prisma.honeycombConfiguration.delete({
      where: { id },
    })
  }

  // ==================== PROCESS MANAGEMENT ====================

  static async createProcess(data: HoneycombProcessCreate) {
    // Verifica che la configurazione esista
    const config = await prisma.honeycombConfiguration.findUnique({
      where: { id: data.configId },
      include: { part: true },
    })

    if (!config) {
      throw new Error('Configurazione honeycomb non trovata')
    }

    // Verifica che l'ODL esista e sia compatibile
    const odl = await prisma.oDL.findUnique({
      where: { id: data.odlId },
    })

    if (!odl) {
      throw new Error('ODL non trovato')
    }

    if (odl.partId !== config.partId) {
      throw new Error('ODL non compatibile con la configurazione honeycomb')
    }

    return await prisma.honeycombProcess.create({
      data,
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async findProcessById(id: string) {
    return await prisma.honeycombProcess.findUnique({
      where: { id },
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async findManyProcesses(
    filters: HoneycombProcessFilter,
    pagination: PaginationParams
  ) {
    const { page, limit } = pagination
    const where: any = {}

    // Apply filters
    if (filters.odlId) {
      where.odlId = filters.odlId
    }

    if (filters.operatorId) {
      where.operatorId = filters.operatorId
    }

    if (filters.processType) {
      where.processType = filters.processType
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startedAt = {}
      if (filters.dateFrom) {
        where.startedAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.startedAt.lte = new Date(filters.dateTo)
      }
    }

    if (filters.search) {
      where.OR = [
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { issues: { contains: filters.search, mode: 'insensitive' } },
        { odl: { odlNumber: { contains: filters.search, mode: 'insensitive' } } },
        { config: { part: { partNumber: { contains: filters.search, mode: 'insensitive' } } } },
      ]
    }

    const [processes, total] = await Promise.all([
      prisma.honeycombProcess.findMany({
        where,
        include: {
          config: {
            include: { part: true },
          },
          odl: true,
          operator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.honeycombProcess.count({ where }),
    ])

    return {
      processes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateProcess(id: string, data: HoneycombProcessUpdate) {
    return await prisma.honeycombProcess.update({
      where: { id },
      data,
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async deleteProcess(id: string) {
    return await prisma.honeycombProcess.delete({
      where: { id },
    })
  }

  // ==================== WORKFLOW OPERATIONS ====================

  static async startProcess(data: HoneycombProcessStart, operatorId: string) {
    const process = await prisma.honeycombProcess.findUnique({
      where: { id: data.processId },
    })

    if (!process) {
      throw new Error('Processo non trovato')
    }

    if (process.status !== ProcessStatus.PENDING) {
      throw new Error('Processo non può essere avviato')
    }

    if (process.operatorId !== operatorId) {
      throw new Error('Solo l\'operatore assegnato può avviare il processo')
    }

    return await prisma.honeycombProcess.update({
      where: { id: data.processId },
      data: {
        status: ProcessStatus.IN_PROGRESS,
        startedAt: new Date(),
        actualTemperature: data.actualTemperature,
        actualPressure: data.actualPressure,
      },
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async completeProcess(data: HoneycombProcessComplete, operatorId: string) {
    const process = await prisma.honeycombProcess.findUnique({
      where: { id: data.processId },
    })

    if (!process) {
      throw new Error('Processo non trovato')
    }

    if (process.status !== ProcessStatus.IN_PROGRESS) {
      throw new Error('Processo non è in corso')
    }

    if (process.operatorId !== operatorId) {
      throw new Error('Solo l\'operatore assegnato può completare il processo')
    }

    const { processId, ...updateData } = data

    return await prisma.honeycombProcess.update({
      where: { id: processId },
      data: {
        ...updateData,
        status: ProcessStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  // ==================== STATISTICS ====================

  static async getProcessStatistics(filters?: HoneycombStatsFilter) {
    const where: any = {}

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    if (filters?.operatorId) {
      where.operatorId = filters.operatorId
    }

    if (filters?.processType) {
      where.processType = filters.processType
    }

    const [
      totalProcesses,
      pendingProcesses,
      inProgressProcesses,
      completedProcesses,
      failedProcesses,
      processesByType,
      qualityStats,
      avgProcessTime,
    ] = await Promise.all([
      prisma.honeycombProcess.count({ where }),
      prisma.honeycombProcess.count({ where: { ...where, status: ProcessStatus.PENDING } }),
      prisma.honeycombProcess.count({ where: { ...where, status: ProcessStatus.IN_PROGRESS } }),
      prisma.honeycombProcess.count({ where: { ...where, status: ProcessStatus.COMPLETED } }),
      prisma.honeycombProcess.count({ where: { ...where, status: ProcessStatus.FAILED } }),
      
      // Processi per tipo
      prisma.honeycombProcess.groupBy({
        by: ['processType'],
        _count: { id: true },
        where,
      }),

      // Statistiche qualità
      prisma.honeycombProcess.groupBy({
        by: ['visualInspection'],
        _count: { id: true },
        where: {
          ...where,
          visualInspection: { not: null },
        },
      }),

      // Tempo medio processo (in ore)
      prisma.honeycombProcess.aggregate({
        where: {
          ...where,
          status: ProcessStatus.COMPLETED,
          startedAt: { not: null },
          completedAt: { not: null },
        },
        _avg: {
          actualTime: true,
        },
      }),
    ])

    const processTypeStats = Object.values(HoneycombProcessType).map(type => ({
      type,
      count: processesByType.find(p => p.processType === type)?._count.id || 0,
    }))

    const qualityPassRate = qualityStats.length > 0 
      ? (qualityStats.find(q => q.visualInspection === QualityResult.PASS)?._count.id || 0) / 
        qualityStats.reduce((sum, q) => sum + q._count.id, 0) * 100
      : 0

    return {
      totalProcesses,
      pendingProcesses,
      inProgressProcesses,
      completedProcesses,
      failedProcesses,
      processTypeStats,
      qualityPassRate: Math.round(qualityPassRate * 100) / 100,
      avgProcessTimeMinutes: avgProcessTime._avg.actualTime || 0,
    }
  }

  // ==================== UTILITY METHODS ====================

  static async getProcessesForODL(odlId: string) {
    return await prisma.honeycombProcess.findMany({
      where: { odlId },
      include: {
        config: {
          include: { part: true },
        },
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  static async getActiveProcesses(operatorId?: string) {
    const where: any = {
      status: { in: [ProcessStatus.PENDING, ProcessStatus.IN_PROGRESS] },
    }

    if (operatorId) {
      where.operatorId = operatorId
    }

    return await prisma.honeycombProcess.findMany({
      where,
      include: {
        config: {
          include: { part: true },
        },
        odl: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
    })
  }

  static async bulkUpdateProcessStatus(processIds: string[], status: ProcessStatus, notes?: string) {
    return await prisma.honeycombProcess.updateMany({
      where: {
        id: { in: processIds },
      },
      data: {
        status,
        ...(notes && { notes }),
        ...(status === ProcessStatus.COMPLETED && { completedAt: new Date() }),
      },
    })
  }
}