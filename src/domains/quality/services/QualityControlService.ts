import { prisma } from '@/lib/prisma'
import {
  QualityControlPlanCreate,
  QualityControlPlanUpdate,
  QualityControlPlanFilter,
  PaginationParams,
} from '../schemas/qualitySchemas'
import { QCInspectionType, QCFrequency } from '@prisma/client'

export class QualityControlService {
  // ==================== QUALITY CONTROL PLANS ====================
  
  static async createPlan(data: QualityControlPlanCreate, createdBy: string) {
    return await prisma.qualityControlPlan.create({
      data: {
        ...data,
        createdBy,
      },
      include: {
        part: true,
      },
    })
  }

  static async findPlanById(id: string) {
    return await prisma.qualityControlPlan.findUnique({
      where: { id },
      include: {
        part: true,
        inspections: {
          take: 5,
          orderBy: { completedAt: 'desc' },
          include: {
            inspector: {
              select: { id: true, name: true, email: true },
            },
            odl: {
              select: { id: true, odlNumber: true },
            },
          },
        },
      },
    })
  }

  static async findManyPlans(
    filters: QualityControlPlanFilter,
    pagination: PaginationParams
  ) {
    const { page, limit } = pagination
    const where: any = {}

    // Apply filters
    if (filters.partId) {
      where.partId = filters.partId
    }

    if (filters.inspectionType) {
      where.inspectionType = filters.inspectionType
    }

    if (filters.frequency) {
      where.frequency = filters.frequency
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { part: { partNumber: { contains: filters.search, mode: 'insensitive' } } },
        { part: { description: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const [plans, total] = await Promise.all([
      prisma.qualityControlPlan.findMany({
        where,
        include: {
          part: true,
          _count: {
            select: { inspections: true },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qualityControlPlan.count({ where }),
    ])

    return {
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updatePlan(id: string, data: QualityControlPlanUpdate) {
    return await prisma.qualityControlPlan.update({
      where: { id },
      data,
      include: {
        part: true,
      },
    })
  }

  static async deletePlan(id: string) {
    // Check ALL foreign key constraints that prevent deletion
    const inspectionCount = await prisma.qualityInspection.count({
      where: { planId: id }
    })
    
    if (inspectionCount > 0) {
      throw new Error(`Cannot delete plan with ${inspectionCount} quality inspections`)
    }
    
    return await prisma.qualityControlPlan.delete({
      where: { id },
    })
  }

  static async togglePlanStatus(id: string) {
    const plan = await prisma.qualityControlPlan.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!plan) {
      throw new Error('Piano di controllo non trovato')
    }

    return await prisma.qualityControlPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
      include: {
        part: true,
      },
    })
  }

  // ==================== STATISTICS ====================

  static async getPlanStatistics() {
    const [
      totalPlans,
      activePlans,
      plansByType,
      plansByFrequency,
      recentInspections,
    ] = await Promise.all([
      prisma.qualityControlPlan.count(),
      prisma.qualityControlPlan.count({ where: { isActive: true } }),
      prisma.qualityControlPlan.groupBy({
        by: ['inspectionType'],
        _count: { id: true },
        where: { isActive: true },
      }),
      prisma.qualityControlPlan.groupBy({
        by: ['frequency'],
        _count: { id: true },
        where: { isActive: true },
      }),
      prisma.qualityInspection.count({
        where: {
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ])

    const inspectionTypeStats = Object.values(QCInspectionType).map(type => ({
      type,
      count: plansByType.find(p => p.inspectionType === type)?._count.id || 0,
    }))

    const frequencyStats = Object.values(QCFrequency).map(frequency => ({
      frequency,
      count: plansByFrequency.find(p => p.frequency === frequency)?._count.id || 0,
    }))

    return {
      totalPlans,
      activePlans,
      inactivePlans: totalPlans - activePlans,
      inspectionTypeStats,
      frequencyStats,
      recentInspections,
    }
  }

  // ==================== UTILITY METHODS ====================

  static async getPlansForPart(partId: string) {
    return await prisma.qualityControlPlan.findMany({
      where: {
        partId,
        isActive: true,
      },
      include: {
        part: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async duplicatePlan(planId: string, createdBy: string) {
    const originalPlan = await prisma.qualityControlPlan.findUnique({
      where: { id: planId },
    })

    if (!originalPlan) {
      throw new Error('Piano di controllo non trovato')
    }

    const { id, createdAt, updatedAt, ...planData } = originalPlan

    return await prisma.qualityControlPlan.create({
      data: {
        ...planData,
        title: `${planData.title} (Copia)`,
        version: '1.0',
        createdBy,
        acceptanceCriteria: planData.acceptanceCriteria as any, // Type cast for Prisma JSON field
      },
      include: {
        part: true,
      },
    })
  }

  static async bulkToggleStatus(planIds: string[], isActive: boolean) {
    return await prisma.qualityControlPlan.updateMany({
      where: {
        id: { in: planIds },
      },
      data: { isActive },
    })
  }
}