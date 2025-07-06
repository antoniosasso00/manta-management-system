import { prisma } from '@/lib/prisma'
import {
  QualityInspectionCreate,
  QualityInspectionUpdate,
  QualityInspectionStart,
  QualityInspectionComplete,
  QualityInspectionSign,
  QualityInspectionFilter,
  PaginationParams,
} from '../schemas/qualitySchemas'
import { QCStatus, QCResult } from '@prisma/client'

export class QualityInspectionService {
  // ==================== CRUD OPERATIONS ====================
  
  static async createInspection(data: QualityInspectionCreate) {
    // Verifica che il piano di controllo esista e sia attivo
    const plan = await prisma.qualityControlPlan.findUnique({
      where: { id: data.planId },
      include: { part: true },
    })

    if (!plan || !plan.isActive) {
      throw new Error('Piano di controllo non trovato o non attivo')
    }

    // Verifica che l\'ODL esista
    const odl = await prisma.oDL.findUnique({
      where: { id: data.odlId },
    })

    if (!odl) {
      throw new Error('ODL non trovato')
    }

    // Verifica che l\'ODL sia compatibile con il piano (stesso part)
    if (odl.partId !== plan.partId) {
      throw new Error('ODL non compatibile con il piano di controllo')
    }

    return await prisma.qualityInspection.create({
      data,
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async findInspectionById(id: string) {
    return await prisma.qualityInspection.findUnique({
      where: { id },
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
        signer: {
          select: { id: true, name: true, email: true },
        },
        nonConformities: {
          include: {
            reporter: {
              select: { id: true, name: true, email: true },
            },
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })
  }

  static async findManyInspections(
    filters: QualityInspectionFilter,
    pagination: PaginationParams
  ) {
    const { page, limit } = pagination
    const where: any = {}

    // Apply filters
    if (filters.odlId) {
      where.odlId = filters.odlId
    }

    if (filters.inspectorId) {
      where.inspectorId = filters.inspectorId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.result) {
      where.result = filters.result
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
        { certificateNumber: { contains: filters.search, mode: 'insensitive' } },
        { odl: { odlNumber: { contains: filters.search, mode: 'insensitive' } } },
        { plan: { title: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const [inspections, total] = await Promise.all([
      prisma.qualityInspection.findMany({
        where,
        include: {
          plan: {
            include: { part: true },
          },
          odl: true,
          inspector: {
            select: { id: true, name: true, email: true },
          },
          signer: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { nonConformities: true },
          },
        },
        orderBy: [
          { status: 'asc' },
          { completedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qualityInspection.count({ where }),
    ])

    return {
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateInspection(id: string, data: QualityInspectionUpdate) {
    return await prisma.qualityInspection.update({
      where: { id },
      data,
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async deleteInspection(id: string) {
    return await prisma.qualityInspection.delete({
      where: { id },
    })
  }

  // ==================== WORKFLOW OPERATIONS ====================

  static async startInspection(data: QualityInspectionStart, inspectorId: string) {
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: data.inspectionId },
    })

    if (!inspection) {
      throw new Error('Ispezione non trovata')
    }

    if (inspection.status !== QCStatus.PENDING) {
      throw new Error('Ispezione non può essere avviata')
    }

    if (inspection.inspectorId !== inspectorId) {
      throw new Error('Solo l\'ispettore assegnato può avviare l\'ispezione')
    }

    return await prisma.qualityInspection.update({
      where: { id: data.inspectionId },
      data: {
        status: QCStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async completeInspection(data: QualityInspectionComplete, inspectorId: string) {
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: data.inspectionId },
    })

    if (!inspection) {
      throw new Error('Ispezione non trovata')
    }

    if (inspection.status !== QCStatus.IN_PROGRESS) {
      throw new Error('Ispezione non è in corso')
    }

    if (inspection.inspectorId !== inspectorId) {
      throw new Error('Solo l\'ispettore assegnato può completare l\'ispezione')
    }

    return await prisma.qualityInspection.update({
      where: { id: data.inspectionId },
      data: {
        status: QCStatus.COMPLETED,
        result: data.result,
        measurements: data.measurements,
        notes: data.notes,
        attachments: data.attachments,
        completedAt: new Date(),
      },
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  static async signInspection(data: QualityInspectionSign, signerId: string) {
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: data.inspectionId },
    })

    if (!inspection) {
      throw new Error('Ispezione non trovata')
    }

    if (inspection.status !== QCStatus.COMPLETED) {
      throw new Error('Ispezione non è completata')
    }

    if (inspection.result !== QCResult.PASS) {
      throw new Error('Solo ispezioni con esito positivo possono essere firmate')
    }

    // Verifica che il numero certificato sia unico
    const existingCertificate = await prisma.qualityInspection.findFirst({
      where: {
        certificateNumber: data.certificateNumber,
        id: { not: data.inspectionId },
      },
    })

    if (existingCertificate) {
      throw new Error('Numero certificato già utilizzato')
    }

    return await prisma.qualityInspection.update({
      where: { id: data.inspectionId },
      data: {
        certificateNumber: data.certificateNumber,
        signedBy: signerId,
        signedAt: new Date(),
      },
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
        signer: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  // ==================== STATISTICS ====================

  static async getInspectionStatistics(inspectorId?: string) {
    const where = inspectorId ? { inspectorId } : {}

    const [
      totalInspections,
      pendingInspections,
      inProgressInspections,
      completedInspections,
      passedInspections,
      failedInspections,
      signedInspections,
      recentActivity,
    ] = await Promise.all([
      prisma.qualityInspection.count({ where }),
      prisma.qualityInspection.count({ where: { ...where, status: QCStatus.PENDING } }),
      prisma.qualityInspection.count({ where: { ...where, status: QCStatus.IN_PROGRESS } }),
      prisma.qualityInspection.count({ where: { ...where, status: QCStatus.COMPLETED } }),
      prisma.qualityInspection.count({ 
        where: { ...where, result: QCResult.PASS } 
      }),
      prisma.qualityInspection.count({ 
        where: { ...where, result: QCResult.FAIL } 
      }),
      prisma.qualityInspection.count({ 
        where: { ...where, signedBy: { not: null } } 
      }),
      prisma.qualityInspection.count({
        where: {
          ...where,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    const passRate = completedInspections > 0 
      ? (passedInspections / completedInspections) * 100 
      : 0

    const signatureRate = passedInspections > 0 
      ? (signedInspections / passedInspections) * 100 
      : 0

    return {
      totalInspections,
      pendingInspections,
      inProgressInspections,
      completedInspections,
      passedInspections,
      failedInspections,
      signedInspections,
      passRate: Math.round(passRate * 100) / 100,
      signatureRate: Math.round(signatureRate * 100) / 100,
      recentActivity,
    }
  }

  // ==================== UTILITY METHODS ====================

  static async getInspectionsForODL(odlId: string) {
    return await prisma.qualityInspection.findMany({
      where: { odlId },
      include: {
        plan: {
          include: { part: true },
        },
        inspector: {
          select: { id: true, name: true, email: true },
        },
        signer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { nonConformities: true },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    })
  }

  static async getOverdueInspections() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    return await prisma.qualityInspection.findMany({
      where: {
        status: QCStatus.IN_PROGRESS,
        startedAt: {
          lt: oneDayAgo,
        },
      },
      include: {
        plan: {
          include: { part: true },
        },
        odl: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    })
  }
}