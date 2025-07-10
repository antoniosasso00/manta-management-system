import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { z, ZodError } from 'zod'
import { updateToolWithPartsSchema } from '@/domains/core/schemas/tool.schema'
import { ToolService } from '@/domains/core/services/ToolService'
import { ResponseHelper, ErrorHelper, AuthHelper } from '@/lib/api-helpers'

export const runtime = 'nodejs'

// GET /api/tools/[id] - Recupera singolo strumento
export const GET = ErrorHelper.withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  const { id } = await params
  const tool = await ToolService.findById(id)

  if (!tool) {
    return ResponseHelper.notFound('Strumento non trovato')
  }

  return ResponseHelper.success({
    id: tool.id,
    toolPartNumber: tool.toolPartNumber,
    description: tool.description,
    base: tool.base,
    height: tool.height,
    weight: tool.weight,
    material: tool.material,
    isActive: tool.isActive,
    associatedParts: tool.partTools?.length || 0,
    parts: tool.partTools?.map(pt => pt.part) || [],
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt
  })
})

// PUT /api/tools/[id] - Aggiorna strumento
export const PUT = ErrorHelper.withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  // Controllo permessi - solo ADMIN e SUPERVISOR possono modificare strumenti
  if (!AuthHelper.canModify(session.user.role)) {
    return ResponseHelper.forbidden()
  }

  const body = await request.json()
  const validatedData = updateToolWithPartsSchema.parse(body)
  const { id } = await params
  
  // Aggiorna tool usando service layer
  const updatedTool = await ToolService.update(id, validatedData)

  // Log audit (could be moved to service layer)
  if (session.user.id) {
    console.log(`🔧 Tool updated: ${updatedTool!.id} by ${session.user.email}`)
  }

  return ResponseHelper.success({
    id: updatedTool!.id,
    toolPartNumber: updatedTool!.toolPartNumber,
    description: updatedTool!.description,
    base: updatedTool!.base,
    height: updatedTool!.height,
    weight: updatedTool!.weight,
    material: updatedTool!.material,
    isActive: updatedTool!.isActive,
    associatedParts: updatedTool!.partTools?.length || 0,
    parts: updatedTool!.partTools?.map(pt => pt.part) || [],
    createdAt: updatedTool!.createdAt,
    updatedAt: updatedTool!.updatedAt
  })
})

// DELETE /api/tools/[id] - Elimina strumento
export const DELETE = ErrorHelper.withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  // Solo ADMIN può eliminare strumenti
  if (!AuthHelper.isAdmin(session.user.role)) {
    return ResponseHelper.forbidden()
  }

  const { id } = await params
  
  // Elimina tool usando service layer
  await ToolService.delete(id)

  // Log audit (could be moved to service layer)
  if (session.user.id) {
    console.log(`🗑️ Tool deleted: ${id} by ${session.user.email}`)
  }

  return ResponseHelper.success({ message: 'Strumento eliminato con successo' })
})