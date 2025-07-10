import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { z, ZodError } from 'zod'
import { createToolWithPartsSchema, toolQuerySchema } from '@/domains/core/schemas/tool.schema'
import { ToolService } from '@/domains/core/services/ToolService'
import { ResponseHelper, ErrorHelper, QueryHelper, AuthHelper } from '@/lib/api-helpers'

export const runtime = 'nodejs'

// GET /api/tools - Lista tutti gli strumenti
export const GET = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const checkUnique = searchParams.get('checkUnique')

  // Endpoint per verificare unicità Part Number
  if (checkUnique) {
    const exists = await ToolService.checkPartNumberExists(checkUnique)
    return ResponseHelper.success({ 
      exists,
      toolPartNumber: checkUnique 
    })
  }

  // Parse query parameters
  const queryParams = {
    search: searchParams.get('search') || undefined,
    isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
    sortBy: searchParams.get('sortBy') || 'toolPartNumber',
    sortOrder: (searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
  }

  // Validate query parameters
  const validatedQuery = toolQuerySchema.parse(queryParams)
  
  // Get tools using service layer
  const result = await ToolService.findMany(validatedQuery)

  return ResponseHelper.paginated(
    result.tools,
    result.total,
    result.page,
    result.limit
  )
})

// POST /api/tools - Crea nuovo strumento
export const POST = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  // Controllo permessi - solo ADMIN e SUPERVISOR possono creare strumenti
  if (!AuthHelper.canModify(session.user.role)) {
    return ResponseHelper.forbidden()
  }

  const body = await request.json()
  console.log('🔍 Received body for tool creation:', JSON.stringify(body, null, 2))
  
  // Validazione dati
  const validatedData = createToolWithPartsSchema.parse(body)
  console.log('✅ Validation passed, data:', JSON.stringify(validatedData, null, 2))
  
  // Crea tool usando service layer
  const newTool = await ToolService.create(validatedData)
  
  console.log('✅ Tool creation completed')

  // Audit log (if needed - could be moved to service layer)
  if (session.user.id) {
    // This could be moved to a separate AuditService
    console.log('📝 Tool created successfully:', newTool?.id)
  }

  return ResponseHelper.created({
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
  })
})