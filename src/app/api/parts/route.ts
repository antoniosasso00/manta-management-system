import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { PartService } from '@/domains/core/services/PartService'
import { createPartSchema, partQuerySchema } from '@/domains/core/schemas/part'
import { ZodError } from 'zod'
import { ResponseHelper, ErrorHelper, AuthHelper } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session) {
    return ResponseHelper.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  
  // Parse parameters safely
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')
  const sortByParam = searchParams.get('sortBy')
  const sortOrderParam = searchParams.get('sortOrder')
  const isActiveParam = searchParams.get('isActive')
  
  const queryParams = {
    search: searchParams.get('search') || undefined,
    isActive: isActiveParam ? isActiveParam === 'true' : undefined,
    page: pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1,
    limit: limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 10)) : 10,
    sortBy: ['partNumber', 'description', 'createdAt'].includes(sortByParam || '') ? sortByParam as 'partNumber' | 'description' | 'createdAt' : 'partNumber',
    sortOrder: ['asc', 'desc'].includes(sortOrderParam || '') ? sortOrderParam as 'asc' | 'desc' : 'asc',
    includeTools: searchParams.get('include') === 'partTools',
  }

  console.log('Raw searchParams:', Object.fromEntries(searchParams.entries()))
  console.log('Parsed queryParams:', queryParams)

  const validatedQuery = partQuerySchema.parse(queryParams)
  const result = await PartService.findMany(validatedQuery)

  return ResponseHelper.paginated(
    result.parts,
    result.total,
    result.page,
    result.limit
  )
})

export const POST = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session) {
    return ResponseHelper.unauthorized()
  }

  // Check if user has admin or supervisor role
  if (!AuthHelper.canModify(session.user.role)) {
    return ResponseHelper.forbidden()
  }

  const body = await request.json()
  const validatedData = createPartSchema.parse(body)
  
  const part = await PartService.create(validatedData)

  return ResponseHelper.created(part)
})