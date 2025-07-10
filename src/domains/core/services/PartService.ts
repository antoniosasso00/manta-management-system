import { prisma } from '@/lib/prisma'
import { Part } from '../entities/Part'
import { CreatePartInput, UpdatePartInput, PartQueryInput, GammaSyncPartInput, BulkCreatePartsInput } from '../schemas/part.schema'
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

    return await prisma.$transaction(async (tx) => {
      // Create main part
      const part = await tx.part.create({
        data: {
          partNumber: input.partNumber,
          description: input.description,
          defaultCuringCycleId: input.defaultCuringCycleId,
          defaultVacuumLines: input.defaultVacuumLines,
        }
      })

      // Create PartAutoclave configuration if provided
      if (input.defaultCuringCycleId || input.defaultVacuumLines || input.autoclaveSetupTime || input.autoclaveLoadPosition) {
        await tx.partAutoclave.create({
          data: {
            partId: part.id,
            curingCycleId: input.defaultCuringCycleId || '',
            vacuumLines: input.defaultVacuumLines || 1,
            setupTime: input.autoclaveSetupTime,
            loadPosition: input.autoclaveLoadPosition,
            notes: null as any,
          }
        })
      }

      // Create PartCleanroom configuration if provided
      if (input.resinType || input.prepregCode || input.cycleTime || input.roomTemperature) {
        await tx.partCleanroom.create({
          data: {
            partId: part.id,
            layupSequence: null as any,
            fiberOrientation: [],
            resinType: input.resinType,
            prepregCode: input.prepregCode,
            roomTemperature: input.roomTemperature,
            humidity: null as any,
            shelfLife: null as any,
            setupTime: null as any,
            cycleTime: input.cycleTime,
          }
        })
      }

      // Create PartNDI configuration if provided
      if (input.inspectionTime || input.calibrationReq) {
        await tx.partNDI.create({
          data: {
            partId: part.id,
            inspectionMethod: [],
            acceptanceCriteria: null as any,
            criticalAreas: null as any,
            inspectionTime: input.inspectionTime,
            requiredCerts: [],
            calibrationReq: input.calibrationReq,
          }
        })
      }

      return Part.fromPrisma(part)
    })
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
    limit: number
    totalPages: number
  }> {
    const { search, page, limit, sortBy, sortOrder, includeTools } = query
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { partNumber: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    const orderBy = { [sortBy]: sortOrder }

    const include = {
      _count: {
        select: { odls: true }
      },
      ...(includeTools && {
        partTools: {
          include: {
            tool: true
          }
        }
      })
    }

    const [data, total] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include
      }),
      prisma.part.count({ where })
    ])

    const parts = data.map(Part.fromPrisma)
    const totalPages = Math.ceil(total / limit)

    return {
      parts,
      total,
      page,
      limit,
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

    return await prisma.$transaction(async (tx) => {
      // Update main part
      const part = await tx.part.update({
        where: { id },
        data: {
          partNumber: input.partNumber,
          description: input.description,
          defaultCuringCycleId: input.defaultCuringCycleId,
          defaultVacuumLines: input.defaultVacuumLines,
        }
      })

      // Update or create PartAutoclave configuration
      if (input.defaultCuringCycleId || input.defaultVacuumLines || input.autoclaveSetupTime || input.autoclaveLoadPosition) {
        await tx.partAutoclave.upsert({
          where: { partId: id },
          update: {
            curingCycleId: input.defaultCuringCycleId || '',
            vacuumLines: input.defaultVacuumLines || 1,
            setupTime: input.autoclaveSetupTime,
            loadPosition: input.autoclaveLoadPosition,
          },
          create: {
            partId: id,
            curingCycleId: input.defaultCuringCycleId || '',
            vacuumLines: input.defaultVacuumLines || 1,
            setupTime: input.autoclaveSetupTime,
            loadPosition: input.autoclaveLoadPosition,
            notes: null as any,
          }
        })
      }

      // Update or create PartCleanroom configuration
      if (input.resinType || input.prepregCode || input.cycleTime || input.roomTemperature) {
        await tx.partCleanroom.upsert({
          where: { partId: id },
          update: {
            resinType: input.resinType,
            prepregCode: input.prepregCode,
            roomTemperature: input.roomTemperature,
            cycleTime: input.cycleTime,
          },
          create: {
            partId: id,
            layupSequence: null as any,
            fiberOrientation: [],
            resinType: input.resinType,
            prepregCode: input.prepregCode,
            roomTemperature: input.roomTemperature,
            humidity: null as any,
            shelfLife: null as any,
            setupTime: null as any,
            cycleTime: input.cycleTime,
          }
        })
      }

      // Update or create PartNDI configuration
      if (input.inspectionTime || input.calibrationReq) {
        await tx.partNDI.upsert({
          where: { partId: id },
          update: {
            inspectionTime: input.inspectionTime,
            calibrationReq: input.calibrationReq,
          },
          create: {
            partId: id,
            inspectionMethod: [],
            acceptanceCriteria: null as any,
            criticalAreas: null as any,
            inspectionTime: input.inspectionTime,
            requiredCerts: [],
            calibrationReq: input.calibrationReq,
          }
        })
      }

      return Part.fromPrisma(part)
    })
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

  static async bulkCreate(parts: CreatePartInput[]): Promise<{
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
        const existing = await prisma.part.findUnique({
          where: { partNumber: partData.partNumber }
        })

        if (existing) {
          skipped++
          continue
        }

        await prisma.part.create({
          data: {
            partNumber: partData.partNumber,
            description: partData.description,
            // defaultCuringCycleId: partData.defaultCuringCycleId,
            // defaultVacuumLines: partData.defaultVacuumLines,
          }
        })
        created++
      } catch (error) {
        errors.push(`Failed to create part ${partData.partNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { created, updated, skipped, errors }
  }

  static async getStatistics(): Promise<{
    totalParts: number
    partsWithSpecs: number
    partsWithoutSpecs: number
    recentlyCreated: number
    totalODLs: number
  }> {
    const [
      totalParts,
      partsWithoutSpecs,
      recentlyCreated,
      totalODLs
    ] = await Promise.all([
      prisma.part.count(),
      prisma.part.count({
        where: {
          AND: [
            { defaultCuringCycleId: null },
            { defaultVacuumLines: null }
          ]
        }
      }),
      prisma.part.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }),
      prisma.oDL.count()
    ])

    const partsWithSpecs = totalParts - partsWithoutSpecs

    return {
      totalParts,
      partsWithSpecs,
      partsWithoutSpecs,
      recentlyCreated,
      totalODLs
    }
  }
}