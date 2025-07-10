import { prisma } from '@/lib/prisma'
import { ODL } from '../entities/ODL'
import { CreateODLInput, UpdateODLInput, ODLQueryInput, GammaSyncODLInput } from '../schemas/odl.schema'
import { SyncStatus } from '@prisma/client'
import QRCode from 'qrcode'
import { QRGenerator, QRValidator } from '@/utils/qr-validation'

export class ODLService {
  
  static async create(input: CreateODLInput): Promise<ODL> {
    // Check if ODL number already exists
    const existing = await prisma.oDL.findUnique({
      where: { odlNumber: input.odlNumber }
    })
    
    if (existing) {
      throw new Error(`ODL number ${input.odlNumber} already exists`)
    }

    // Verify part exists
    const part = await prisma.part.findUnique({
      where: { id: input.partId }
    })

    if (!part) {
      throw new Error(`Part with ID ${input.partId} not found`)
    }

    // Generate QR code using secure generator
    const qrData = QRGenerator.generateODLQR({
      id: input.odlNumber,
      partNumber: part.partNumber,
      priority: input.priority
    })
    
    // Validate generated QR data
    const validation = QRValidator.validateODLQR(QRGenerator.toQRString(qrData))
    if (!validation.success) {
      throw new Error(`Invalid QR data generated: ${validation.error}`)
    }
    
    const qrCode = await QRCode.toString(QRGenerator.toQRString(qrData), { type: 'svg' })

    // Verify tool association if provided
    if (input.toolId) {
      const toolAssociation = await prisma.partTool.findFirst({
        where: {
          partId: input.partId,
          toolId: input.toolId
        }
      })
      
      if (!toolAssociation) {
        throw new Error(`Tool not associated with part ${part.partNumber}`)
      }
    }

    const data = await prisma.oDL.create({
      data: {
        odlNumber: input.odlNumber,
        partId: input.partId,
        quantity: input.quantity,
        priority: input.priority,
        qrCode: qrCode,
        notes: input.notes,
        expectedCompletionDate: input.expectedCompletionDate,
        toolId: input.toolId,
      },
      include: {
        part: {
          include: {
            partTools: {
              include: {
                tool: true
              }
            }
          }
        },
        tool: true
      }
    })

    return ODL.fromPrisma(data)
  }

  static async findById(id: string): Promise<ODL | null> {
    const data = await prisma.oDL.findUnique({
      where: { id },
      include: {
        part: true,
        tool: true,
        events: {
          include: {
            department: true,
            user: true
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    })

    return data ? ODL.fromPrisma(data) : null
  }

  static async findByODLNumber(odlNumber: string): Promise<ODL | null> {
    const data = await prisma.oDL.findUnique({
      where: { odlNumber },
      include: {
        part: true,
        tool: true,
        events: {
          include: {
            department: true,
            user: true
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    })

    return data ? ODL.fromPrisma(data) : null
  }

  static async findMany(query: ODLQueryInput): Promise<{
    odls: ODL[]
    total: number
    page: number
    totalPages: number
  }> {
    const { search, partId, status, page, limit, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: { [key: string]: any } = {} // Prisma where clause

    if (search) {
      where.OR = [
        { odlNumber: { contains: search, mode: 'insensitive' } },
        { part: { partNumber: { contains: search, mode: 'insensitive' } } },
        { part: { description: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (partId) {
      where.partId = partId
    }

    if (status) {
      where.status = status
    }

    const orderBy = { [sortBy]: sortOrder }

    const [data, total] = await Promise.all([
      prisma.oDL.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          part: true,
          tool: true,
          _count: {
            select: { events: true }
          }
        }
      }),
      prisma.oDL.count({ where })
    ])

    const odls = data.map(ODL.fromPrisma)
    const totalPages = Math.ceil(total / limit)

    return {
      odls,
      total,
      page,
      totalPages
    }
  }

  static async update(id: string, input: UpdateODLInput): Promise<ODL> {
    const existing = await prisma.oDL.findUnique({
      where: { id },
      include: { part: true }
    })

    if (!existing) {
      throw new Error('ODL not found')
    }

    // Check if new ODL number conflicts
    if (input.odlNumber && input.odlNumber !== existing.odlNumber) {
      const conflict = await prisma.oDL.findUnique({
        where: { odlNumber: input.odlNumber }
      })
      if (conflict) {
        throw new Error(`ODL number ${input.odlNumber} already exists`)
      }
    }

    // Verify new part exists if partId is being changed
    if (input.partId && input.partId !== existing.partId) {
      const part = await prisma.part.findUnique({
        where: { id: input.partId }
      })
      if (!part) {
        throw new Error(`Part with ID ${input.partId} not found`)
      }
    }

    const data = await prisma.oDL.update({
      where: { id },
      data: {
        odlNumber: input.odlNumber,
        partId: input.partId,
        quantity: input.quantity,
        priority: input.priority,
        notes: input.notes,
        expectedCompletionDate: input.expectedCompletionDate,
        toolId: input.toolId,
      },
      include: {
        part: true,
        tool: true
      }
    })

    return ODL.fromPrisma(data)
  }

  static async delete(id: string): Promise<void> {
    // Check if ODL has production events
    const eventCount = await prisma.productionEvent.count({
      where: { odlId: id }
    })

    if (eventCount > 0) {
      throw new Error(`Cannot delete ODL with ${eventCount} production events`)
    }

    await prisma.oDL.delete({
      where: { id }
    })
  }

  static async syncFromGamma(odls: GammaSyncODLInput[]): Promise<{
    created: number
    updated: number
    skipped: number
    errors: string[]
  }> {
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const odlData of odls) {
      try {
        // Find part by part number
        const part = await prisma.part.findUnique({
          where: { partNumber: odlData.partNumber }
        })

        if (!part) {
          errors.push(`ODL ${odlData.odlNumber}: Part ${odlData.partNumber} not found`)
          skipped++
          continue
        }

        const existing = await prisma.oDL.findFirst({
          where: {
            OR: [
              { odlNumber: odlData.odlNumber },
              { gammaId: odlData.gammaId }
            ]
          }
        })

        if (existing) {
          // Update existing ODL
          await prisma.oDL.update({
            where: { id: existing.id },
            data: {
              odlNumber: odlData.odlNumber,
              partId: part.id,
              quantity: odlData.quantity,
              gammaId: odlData.gammaId,
              lastSyncAt: new Date(),
              syncStatus: SyncStatus.SUCCESS,
            }
          })
          updated++
        } else {
          // Generate QR code for new ODL using secure generator
          const qrData = QRGenerator.generateODLQR({
            id: odlData.odlNumber,
            partNumber: part.partNumber
          })
          
          // Validate generated QR data
          const validation = QRValidator.validateODLQR(QRGenerator.toQRString(qrData))
          if (!validation.success) {
            throw new Error(`Invalid QR data for ODL ${odlData.odlNumber}: ${validation.error}`)
          }
          
          const qrCode = await QRCode.toString(QRGenerator.toQRString(qrData), { type: 'svg' })

          // Create new ODL
          await prisma.oDL.create({
            data: {
              odlNumber: odlData.odlNumber,
              partId: part.id,
              quantity: odlData.quantity,
              qrCode: qrCode,
              gammaId: odlData.gammaId,
              lastSyncAt: new Date(),
              syncStatus: SyncStatus.SUCCESS,
            }
          })
          created++
        }
      } catch (error) {
        errors.push(`ODL ${odlData.odlNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        skipped++
      }
    }

    return { created, updated, skipped, errors }
  }

  static async getODLsByPart(partId: string): Promise<ODL[]> {
    const data = await prisma.oDL.findMany({
      where: { partId },
      include: { part: true },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(ODL.fromPrisma)
  }

  static async getODLsByStatus(status: string): Promise<ODL[]> {
    const data = await prisma.oDL.findMany({
      where: { status: status as any }, // eslint-disable-line @typescript-eslint/no-explicit-any
      include: { part: true },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(ODL.fromPrisma)
  }

  static async getODLsInProduction(): Promise<ODL[]> {
    const data = await prisma.oDL.findMany({
      where: {
        status: {
          in: ['IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI']
        }
      },
      include: { part: true },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(ODL.fromPrisma)
  }

  static async getODLsByGammaSync(syncStatus?: SyncStatus): Promise<ODL[]> {
    const where = syncStatus ? { syncStatus } : { gammaId: { not: null } }
    
    const data = await prisma.oDL.findMany({
      where,
      include: { part: true },
      orderBy: { lastSyncAt: 'desc' }
    })

    return data.map(ODL.fromPrisma)
  }

  static async regenerateQRCode(id: string): Promise<ODL> {
    const odl = await this.findById(id)
    if (!odl) {
      throw new Error('ODL not found')
    }

    const qrData = QRGenerator.generateODLQR({
      id: odl.odlNumber,
      partNumber: odl.part?.partNumber || '',
      priority: odl.priority as any
    })
    
    // Validate regenerated QR data
    const validation = QRValidator.validateODLQR(QRGenerator.toQRString(qrData))
    if (!validation.success) {
      throw new Error(`Invalid QR data for regeneration: ${validation.error}`)
    }
    
    const qrCode = await QRCode.toString(QRGenerator.toQRString(qrData), { type: 'svg' })

    const data = await prisma.oDL.update({
      where: { id },
      data: { qrCode },
      include: { part: true }
    })

    return ODL.fromPrisma(data)
  }
}