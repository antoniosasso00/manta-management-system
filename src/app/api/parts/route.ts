import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { PartService } from '@/domains/core/services/PartService'
import { createPartSchema, partQuerySchema } from '@/domains/core/schemas/part.schema'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const sortByParam = searchParams.get('sortBy')
    const sortOrderParam = searchParams.get('sortOrder')
    
    const queryParams = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      page: pageParam ? Math.max(1, parseInt(pageParam)) || 1 : 1,
      limit: limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) || 10 : 10,
      sortBy: ['partNumber', 'description', 'createdAt'].includes(sortByParam || '') ? sortByParam : 'partNumber',
      sortOrder: ['asc', 'desc'].includes(sortOrderParam || '') ? sortOrderParam : 'asc',
      includeTools: searchParams.get('include') === 'partTools',
    }

    console.log('Raw searchParams:', Object.fromEntries(searchParams.entries()))
    console.log('Parsed queryParams:', queryParams)

    const validatedQuery = partQuerySchema.parse(queryParams)
    const result = await PartService.findMany(validatedQuery)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching parts:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or supervisor role
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPartSchema.parse(body)
    
    const part = await PartService.create(validatedData)

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    console.error('Error creating part:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}