import { prisma } from '@/lib/prisma'
import type { CreatePartInput, UpdatePartInput, PartQueryInput } from '../schemas/part.schema'
import { Prisma } from '@prisma/client'

export class PartService {
  static async findMany(query: PartQueryInput) {
    const { search, page, limit, sortBy, sortOrder } = query
    
    const where: Prisma.PartWhereInput = search ? {
      OR: [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    } : {}

    const [parts, totalCount] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          defaultCuringCycle: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              odls: true,
              partTools: true,
            },
          },
        },
      }),
      prisma.part.count({ where }),
    ])

    return {
      data: parts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    }
  }

  static async findById(id: string) {
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        defaultCuringCycle: true,
        partTools: {
          include: {
            tool: true,
          },
        },
        odls: {
          select: {
            id: true,
            odlNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            odls: true,
            partTools: true,
          },
        },
      },
    })

    if (!part) {
      throw new Error('Part not found')
    }

    return part
  }

  static async findByPartNumber(partNumber: string) {
    return prisma.part.findUnique({
      where: { partNumber },
      include: {
        defaultCuringCycle: true,
      },
    })
  }

  static async create(data: CreatePartInput) {
    // Check if part number already exists
    const existingPart = await this.findByPartNumber(data.partNumber)
    if (existingPart) {
      throw new Error(`Part number ${data.partNumber} already exists`)
    }

    // Validate curing cycle if provided
    if (data.defaultCuringCycleId) {
      const curingCycle = await prisma.curingCycle.findUnique({
        where: { id: data.defaultCuringCycleId },
      })
      if (!curingCycle) {
        throw new Error('Invalid curing cycle ID')
      }
    }

    return prisma.part.create({
      data: {
        ...data,
        syncStatus: 'SUCCESS',
      },
      include: {
        defaultCuringCycle: true,
      },
    })
  }

  static async update(id: string, data: Omit<UpdatePartInput, 'id'>) {
    // Check if part exists
    const existingPart = await prisma.part.findUnique({ where: { id } })
    if (!existingPart) {
      throw new Error('Part not found')
    }

    // Check for part number conflicts if updating part number
    if (data.partNumber && data.partNumber !== existingPart.partNumber) {
      const duplicatePart = await this.findByPartNumber(data.partNumber)
      if (duplicatePart) {
        throw new Error(`Part number ${data.partNumber} already exists`)
      }
    }

    // Validate curing cycle if provided
    if (data.defaultCuringCycleId) {
      const curingCycle = await prisma.curingCycle.findUnique({
        where: { id: data.defaultCuringCycleId },
      })
      if (!curingCycle) {
        throw new Error('Invalid curing cycle ID')
      }
    }

    return prisma.part.update({
      where: { id },
      data,
      include: {
        defaultCuringCycle: true,
      },
    })
  }

  static async delete(id: string) {
    // Check if part exists
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            odls: true,
            partTools: true,
          },
        },
      },
    })

    if (!existingPart) {
      throw new Error('Part not found')
    }

    // Check for existing relationships
    if (existingPart._count.odls > 0) {
      throw new Error(`Cannot delete part: ${existingPart._count.odls} ODL records exist`)
    }

    if (existingPart._count.partTools > 0) {
      throw new Error(`Cannot delete part: ${existingPart._count.partTools} tool associations exist`)
    }

    await prisma.part.delete({ where: { id } })
    return { success: true }
  }

  static async bulkCreate(parts: CreatePartInput[]) {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const partData of parts) {
      try {
        await this.create(partData)
        results.created++
      } catch (error) {
        results.skipped++
        results.errors.push(
          `${partData.partNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return results
  }

  static async getStatistics() {
    const [totalParts, partsWithODLs, recentParts] = await Promise.all([
      prisma.part.count(),
      prisma.part.count({
        where: {
          odls: {
            some: {},
          },
        },
      }),
      prisma.part.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ])

    return {
      totalParts,
      partsWithODLs,
      partsWithoutODLs: totalParts - partsWithODLs,
      recentParts,
    }
  }
}