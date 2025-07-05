import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-node'
import { z, ZodError } from 'zod'
import { updateToolWithPartsSchema } from '@/domains/core/schemas/tool.schema'

// GET /api/tools/[id] - Recupera singolo strumento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    const tool = await prisma.tool.findUnique({
      where: { id },
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

    if (!tool) {
      return NextResponse.json({ error: 'Strumento non trovato' }, { status: 404 })
    }

    return NextResponse.json({
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
    })

  } catch (error) {
    console.error('Error fetching tool:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dello strumento' },
      { status: 500 }
    )
  }
}

// PUT /api/tools/[id] - Aggiorna strumento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Controllo permessi - solo ADMIN e SUPERVISOR possono modificare strumenti
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateToolWithPartsSchema.parse(body)

    const { id } = await params
    
    // Verifica esistenza strumento
    const existingTool = await prisma.tool.findUnique({
      where: { id }
    })

    if (!existingTool) {
      return NextResponse.json({ error: 'Strumento non trovato' }, { status: 404 })
    }

    // Se si sta cambiando il Part Number, verifica unicità
    if (validatedData.toolPartNumber && validatedData.toolPartNumber !== existingTool.toolPartNumber) {
      const duplicateTool = await prisma.tool.findUnique({
        where: { toolPartNumber: validatedData.toolPartNumber }
      })

      if (duplicateTool) {
        return NextResponse.json(
          { error: 'Part Number già esistente' },
          { status: 400 }
        )
      }
    }

    const { associatedPartIds, ...toolData } = validatedData

    const updatedTool = await prisma.$transaction(async (tx) => {
      // Update the tool
      const tool = await tx.tool.update({
        where: { id },
        data: toolData,
        include: {
          partTools: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  description: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      // Update part associations if provided
      if (associatedPartIds !== undefined) {
        // Remove all existing associations
        await tx.partTool.deleteMany({
          where: { toolId: id }
        })

        // Create new associations
        if (associatedPartIds.length > 0) {
          await tx.partTool.createMany({
            data: associatedPartIds.map(partId => ({
              toolId: id,
              partId: partId
            }))
          })
        }

        // Refetch with updated associations
        return await tx.tool.findUnique({
          where: { id },
          include: {
            partTools: {
              include: {
                part: {
                  select: {
                    id: true,
                    partNumber: true,
                    description: true,
                    isActive: true
                  }
                }
              }
            }
          }
        })
      }

      return tool
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'Tool',
        resourceId: updatedTool!.id,
        details: {
          toolPartNumber: updatedTool!.toolPartNumber,
          associatedParts: updatedTool!.partTools.length
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      id: updatedTool!.id,
      toolPartNumber: updatedTool!.toolPartNumber,
      description: updatedTool!.description,
      base: updatedTool!.base,
      height: updatedTool!.height,
      weight: updatedTool!.weight,
      material: updatedTool!.material,
      isActive: updatedTool!.isActive,
      associatedParts: updatedTool!.partTools.length,
      parts: updatedTool!.partTools.map(pt => pt.part),
      createdAt: updatedTool!.createdAt,
      updatedAt: updatedTool!.updatedAt
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating tool:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dello strumento' },
      { status: 500 }
    )
  }
}

// DELETE /api/tools/[id] - Elimina strumento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Solo ADMIN può eliminare strumenti
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const { id } = await params
    
    // Verifica esistenza strumento
    const existingTool = await prisma.tool.findUnique({
      where: { id },
      include: {
        partTools: true
      }
    })

    if (!existingTool) {
      return NextResponse.json({ error: 'Strumento non trovato' }, { status: 404 })
    }

    // Verifica se il strumento è associato a delle parti
    if (existingTool.partTools.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: strumento associato a delle parti' },
        { status: 400 }
      )
    }

    await prisma.tool.delete({
      where: { id }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'Tool',
        resourceId: id,
        details: {
          toolPartNumber: existingTool.toolPartNumber
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ message: 'Strumento eliminato con successo' })

  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dello strumento' },
      { status: 500 }
    )
  }
}