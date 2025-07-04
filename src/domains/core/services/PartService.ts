import { prisma } from '@/lib/prisma'
import { Part } from '../entities/Part'
import { CreatePartInput, UpdatePartInput, PartQueryInput, GammaSyncPartInput } from '../schemas/part.schema'
import { SyncStatus } from '@prisma/client'

export class PartService {
  
  static async create(input: CreatePartInput): Promise<Part> {
    // Check if part number already exists
    const existing = await prisma.part.findUnique({
      where: { partNumber: input.partNumber }
    })
    
    if (existing) {
      throw new Error(`Part number ${input.partNumber} already exists`)
    }

    const data = await prisma.part.create({
      data: {
        partNumber: input.partNumber,
        description: input.description,
        defaultCuringCycleId: input.defaultCuringCycleId,
        defaultVacuumLines: input.defaultVacuumLines,
      }
    })

    return Part.fromPrisma(data)
  }

  static async findById(id: string): Promise<Part | null> {
    const data = await prisma.part.findUnique({
      where: { id },
      include: {
        odls: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 ODLs
        }
      }
    })

    return data ? Part.fromPrisma(data) : null
  }

  static async findByPartNumber(partNumber: string): Promise<Part | null> {
    const data = await prisma.part.findUnique({
      where: { partNumber },
      include: {
        odls: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    })

    return data ? Part.fromPrisma(data) : null
  }

  static async findMany(query: PartQueryInput): Promise<{
    parts: Part[]
    total: number
    page: number
    totalPages: number
  }> {
    const { search, page, limit, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { partNumber: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    const orderBy = { [sortBy]: sortOrder }

    const [data, total] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { odls: true }
          }
        }
      }),
      prisma.part.count({ where })
    ])

    const parts = data.map(Part.fromPrisma)
    const totalPages = Math.ceil(total / limit)

    return {
      parts,
      total,
      page,
      totalPages
    }
  }

  static async update(id: string, input: UpdatePartInput): Promise<Part> {
    const existing = await prisma.part.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('Part not found')
    }

    // Check if new part number conflicts
    if (input.partNumber && input.partNumber !== existing.partNumber) {
      const conflict = await prisma.part.findUnique({
        where: { partNumber: input.partNumber }
      })
      if (conflict) {
        throw new Error(`Part number ${input.partNumber} already exists`)
      }
    }

    const data = await prisma.part.update({
      where: { id },
      data: {
        partNumber: input.partNumber,
        description: input.description,
        defaultCuringCycleId: input.defaultCuringCycleId,
        defaultVacuumLines: input.defaultVacuumLines,
      }
    })

    return Part.fromPrisma(data)
  }

  static async delete(id: string): Promise<void> {
    // Check if part has ODLs
    const odlCount = await prisma.oDL.count({
      where: { partId: id }
    })

    if (odlCount > 0) {
      throw new Error(`Cannot delete part with ${odlCount} associated ODLs`)
    }

    await prisma.part.delete({
      where: { id }
    })
  }

  static async syncFromGamma(parts: GammaSyncPartInput[]): Promise<{
    created: number
    updated: number
    skipped: number
    errors: string[]
  }> {
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const partData of parts) {
      try {
        const existing = await prisma.part.findFirst({
          where: {
            OR: [
              { partNumber: partData.partNumber },
              { gammaId: partData.gammaId }
            ]
          }
        })

        if (existing) {
          // Update existing part
          await prisma.part.update({
            where: { id: existing.id },
            data: {
              partNumber: partData.partNumber,
              description: partData.description,
              gammaId: partData.gammaId,
              lastSyncAt: new Date(),
              syncStatus: SyncStatus.SUCCESS,
            }
          })
          updated++
        } else {
          // Create new part
          await prisma.part.create({
            data: {
              partNumber: partData.partNumber,
              description: partData.description,
              gammaId: partData.gammaId,
              lastSyncAt: new Date(),
              syncStatus: SyncStatus.SUCCESS,
            }
          })
          created++
        }
      } catch (error) {
        errors.push(`Part ${partData.partNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        skipped++
      }
    }

    return { created, updated, skipped, errors }
  }

  static async getPartsWithoutSpecs(): Promise<Part[]> {
    const data = await prisma.part.findMany({
      where: {
        AND: [
          { defaultCuringCycleId: null },
          { defaultVacuumLines: null }
        ]
      },
      orderBy: { partNumber: 'asc' }
    })

    return data.map(Part.fromPrisma)
  }

  static async getPartsByGammaSync(syncStatus?: SyncStatus): Promise<Part[]> {
    const where = syncStatus ? { syncStatus } : { gammaId: { not: null } }
    
    const data = await prisma.part.findMany({
      where,
      orderBy: { lastSyncAt: 'desc' }
    })

    return data.map(Part.fromPrisma)
  }
}