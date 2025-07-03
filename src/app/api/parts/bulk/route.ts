import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PartService } from '@/domains/core/services/PartService'
import { bulkCreatePartsSchema } from '@/domains/core/schemas/part.schema'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and SUPERVISOR can bulk create parts
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bulkCreatePartsSchema.parse(body)
    
    const result = await PartService.bulkCreate(validatedData.parts)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error bulk creating parts:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}