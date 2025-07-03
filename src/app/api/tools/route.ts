import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Schema di validazione per la creazione/aggiornamento strumenti
const createToolSchema = z.object({
  toolPartNumber: z.string().min(1, 'Part Number richiesto'),
  description: z.string().optional(),
  base: z.number().positive('Dimensione base deve essere positiva'),
  height: z.number().positive('Altezza deve essere positiva'),
  weight: z.number().positive().optional(),
  material: z.string().min(1, 'Materiale richiesto'),
  isActive: z.boolean().optional().default(true)
})

// GET /api/tools - Lista tutti gli strumenti
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { toolPartNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const tools = await prisma.tool.findMany({
      where,
      include: {
        partTools: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { toolPartNumber: 'asc' }
      ]
    })

    // Trasforma i dati per l'interfaccia
    const transformedTools = tools.map(tool => ({
      id: tool.id,
      toolPartNumber: tool.toolPartNumber,
      description: tool.description,
      base: tool.base,
      height: tool.height,
      weight: tool.weight,
      material: tool.material,
      isActive: tool.isActive,
      associatedParts: tool.partTools.length,
      parts: tool.partTools.map(pt => pt.part),
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt
    }))

    return NextResponse.json(transformedTools)

  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli strumenti' },
      { status: 500 }
    )
  }
}

// POST /api/tools - Crea nuovo strumento
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Controllo permessi - solo ADMIN e SUPERVISOR possono creare strumenti
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createToolSchema.parse(body)

    // Verifica unicità del Part Number
    const existingTool = await prisma.tool.findUnique({
      where: { toolPartNumber: validatedData.toolPartNumber }
    })

    if (existingTool) {
      return NextResponse.json(
        { error: 'Part Number già esistente' },
        { status: 400 }
      )
    }

    const newTool = await prisma.tool.create({
      data: validatedData,
      include: {
        partTools: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                description: true
              }
            }
          }
        }
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TOOL_CREATE',
        resource: 'TOOL',
        resourceId: newTool.id,
        details: `Created tool ${newTool.toolPartNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      id: newTool.id,
      toolPartNumber: newTool.toolPartNumber,
      description: newTool.description,
      base: newTool.base,
      height: newTool.height,
      weight: newTool.weight,
      material: newTool.material,
      isActive: newTool.isActive,
      associatedParts: newTool.partTools.length,
      parts: newTool.partTools.map(pt => pt.part),
      createdAt: newTool.createdAt,
      updatedAt: newTool.updatedAt
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dello strumento' },
      { status: 500 }
    )
  }
}