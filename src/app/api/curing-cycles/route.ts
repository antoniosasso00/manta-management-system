import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for curing cycle
const curingCycleSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  phase1Temperature: z.number().min(0, 'Phase 1 temperature must be positive'),
  phase1Pressure: z.number().min(0, 'Phase 1 pressure must be positive'),
  phase1Duration: z.number().int().min(1, 'Phase 1 duration must be at least 1 minute'),
  phase2Temperature: z.number().min(0).optional(),
  phase2Pressure: z.number().min(0).optional(),
  phase2Duration: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
})

// GET /api/curing-cycles - List all curing cycles
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get total count
    const totalCount = await prisma.curingCycle.count({ where })

    // Get curing cycles
    const curingCycles = await prisma.curingCycle.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { code: 'asc' }
      ],
      include: {
        _count: {
          select: {
            defaultParts: true,
            autoclaveLoads: true,
          }
        }
      }
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      data: curingCycles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      }
    })

  } catch (error) {
    console.error('Error fetching curing cycles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curing cycles' },
      { status: 500 }
    )
  }
}

// POST /api/curing-cycles - Create a new curing cycle
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create curing cycles
    // Only ADMIN and SUPERVISOR roles can create curing cycles
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = curingCycleSchema.parse(body)

    // Check if code already exists
    const existingCycle = await prisma.curingCycle.findUnique({
      where: { code: validatedData.code }
    })

    if (existingCycle) {
      return NextResponse.json(
        { error: 'A curing cycle with this code already exists' },
        { status: 409 }
      )
    }

    const curingCycle = await prisma.curingCycle.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            defaultParts: true,
            autoclaveLoads: true,
          }
        }
      }
    })

    return NextResponse.json(curingCycle, { status: 201 })

  } catch (error) {
    console.error('Error creating curing cycle:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create curing cycle' },
      { status: 500 }
    )
  }
}