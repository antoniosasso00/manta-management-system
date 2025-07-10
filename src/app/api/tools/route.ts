import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-node'
import { z, ZodError } from 'zod'
import { createToolWithPartsSchema, toolQuerySchema } from '@/domains/core/schemas/tool.schema'

export const runtime = 'nodejs'

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
    const checkUnique = searchParams.get('checkUnique')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const sortByParam = searchParams.get('sortBy')
    const sortOrderParam = searchParams.get('sortOrder')

    // Endpoint per verificare unicità Part Number
    if (checkUnique) {
      const existing = await prisma.tool.findUnique({
        where: { toolPartNumber: checkUnique },
        select: { id: true, toolPartNumber: true }
      })
      
      return NextResponse.json({ 
        exists: !!existing,
        toolPartNumber: checkUnique 
      })
    }

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

    // Pagination parameters
    const page = pageParam ? Math.max(1, parseInt(pageParam)) || 1 : 1
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) || 10 : 10
    const sortBy = ['toolPartNumber', 'description', 'material', 'createdAt'].includes(sortByParam || '') ? sortByParam : 'toolPartNumber'
    const sortOrder = ['asc', 'desc'].includes(sortOrderParam || '') ? sortOrderParam : 'asc'

    // Build orderBy clause
    const orderBy: any[] = []
    if (sortBy === 'toolPartNumber') {
      orderBy.push({ toolPartNumber: sortOrder })
    } else if (sortBy === 'description') {
      orderBy.push({ description: sortOrder })
    } else if (sortBy === 'material') {
      orderBy.push({ material: sortOrder })
    } else if (sortBy === 'createdAt') {
      orderBy.push({ createdAt: sortOrder })
    }
    
    // Add secondary sort by toolPartNumber for consistency
    if (sortBy !== 'toolPartNumber') {
      orderBy.push({ toolPartNumber: 'asc' })
    }

    // Get total count for pagination
    const total = await prisma.tool.count({ where })

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
      orderBy,
      skip: (page - 1) * limit,
      take: limit
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

    // Return paginated response
    return NextResponse.json({
      tools: transformedTools,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

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
    console.log('🔍 Received body for tool creation:', JSON.stringify(body, null, 2))
    
    try {
      const validatedData = createToolWithPartsSchema.parse(body)
      console.log('✅ Validation passed, data:', JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      console.error('❌ Schema validation failed:', validationError)
      throw validationError
    }
    
    const validatedData = createToolWithPartsSchema.parse(body)

    // Verifica unicità del Part Number
    console.log('🔍 Checking if tool part number exists:', validatedData.toolPartNumber)
    const existingTool = await prisma.tool.findUnique({
      where: { toolPartNumber: validatedData.toolPartNumber }
    })

    if (existingTool) {
      console.log('❌ Tool part number already exists')
      return NextResponse.json(
        { error: 'Part Number già esistente' },
        { status: 400 }
      )
    }

    console.log('✅ Tool part number is unique')
    const { associatedPartIds, ...toolData } = validatedData
    console.log('📝 Tool data to create:', JSON.stringify(toolData, null, 2))
    console.log('🔗 Associated part IDs:', associatedPartIds)
    
    const newTool = await prisma.$transaction(async (tx) => {
      // Create the tool
      console.log('🏗️ Creating tool in database...')
      const tool = await tx.tool.create({
        data: {
          ...toolData
        },
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

      // Create part associations if provided
      if (associatedPartIds && associatedPartIds.length > 0) {
        console.log('🔗 Creating part associations...')
        await tx.partTool.createMany({
          data: associatedPartIds.map(partId => ({
            toolId: tool.id,
            partId: partId
          }))
        })

        // Refetch with associations
        const toolWithAssociations = await tx.tool.findUnique({
          where: { id: tool.id },
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

        // Log audit inside transaction only if user ID exists and is valid
        if (session.user.id) {
          const userExists = await tx.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
          })
          
          if (userExists) {
            console.log('📝 Creating audit log in transaction...')
            await tx.auditLog.create({
              data: {
                userId: session.user.id,
                userEmail: session.user.email || 'unknown',
                action: 'CREATE',
                resource: 'Tool',
                resourceId: tool.id,
                details: {
                  toolPartNumber: tool.toolPartNumber,
                  associatedParts: toolWithAssociations!.partTools?.length || 0
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
              }
            })
          } else {
            console.warn(`Skipping audit log: userId ${session.user.id} not found in database`)
          }
        }

        return toolWithAssociations
      }

      // Log audit inside transaction for tools without associations only if user ID exists and is valid
      if (session.user.id) {
        const userExists = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { id: true }
        })
        
        if (userExists) {
          console.log('📝 Creating audit log in transaction...')
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              userEmail: session.user.email || 'unknown',
              action: 'CREATE',
              resource: 'Tool',
              resourceId: tool.id,
              details: {
                toolPartNumber: tool.toolPartNumber,
                associatedParts: 0
              },
              ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          })
        } else {
          console.warn(`Skipping audit log: userId ${session.user.id} not found in database`)
        }
      }

      console.log('✅ Tool created successfully without associations')
      return tool
    })

    console.log('✅ Tool creation transaction completed')

    return NextResponse.json({
      id: newTool!.id,
      toolPartNumber: newTool!.toolPartNumber,
      description: newTool!.description,
      base: newTool!.base,
      height: newTool!.height,
      weight: newTool!.weight,
      material: newTool!.material,
      isActive: newTool!.isActive,
      associatedParts: newTool!.partTools?.length || 0,
      parts: newTool!.partTools?.map(pt => pt.part) || [],
      createdAt: newTool!.createdAt,
      updatedAt: newTool!.updatedAt
    }, { status: 201 })

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Zod validation error:', error.errors)
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    // Gestisci errori di database constraint (duplicati)
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; constraint?: string; meta?: { target: string[] } }
      
      // Prisma error P2002 = constraint violation (unique constraint)
      if (dbError.code === 'P2002') {
        console.error('❌ Database constraint violation:', dbError)
        return NextResponse.json(
          { error: 'Part Number già esistente' },
          { status: 400 }
        )
      }
    }

    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dello strumento' },
      { status: 500 }
    )
  }
}