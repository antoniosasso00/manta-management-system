import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { PartService } from '@/domains/core/services/PartService'
import { updatePartSchema } from '@/domains/core/schemas/part.schema'
import { ZodError } from 'zod'

export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const part = await PartService.findById((await params).id)
    
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only ADMIN, SUPERVISOR, or CAPO_REPARTO can update parts
    const canUpdate = session.user.role === 'ADMIN' || 
                     session.user.role === 'SUPERVISOR' ||
                     session.user.departmentRole === 'CAPO_REPARTO'
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updatePartSchema.parse({ ...body, id: (await params).id })
    
    const { id, ...updateData } = validatedData
    const part = await PartService.update(id, updateData)

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error updating part:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'Part not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await PartService.delete((await params).id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting part:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Part not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('associated ODLs')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}