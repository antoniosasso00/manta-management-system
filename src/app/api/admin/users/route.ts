import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { createUserWithRoleSchema } from '@/domains/user/schemas/user.schema'
import { auditHelpers } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const status = searchParams.get('status') || ''

    // Build where clause
    const where: Record<string, unknown> = {}
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Role filter
    if (role) {
      where.role = role
    }
    
    // Department filter
    if (departmentId) {
      where.departmentId = departmentId
    }
    
    // Status filter
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.user.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get users with filters and pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        departmentRole: true,
        createdAt: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const validatedData = createUserWithRoleSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già in uso' },
        { status: 400 }
      )
    }

    // Validate department assignment if provided
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId }
      })

      if (!department || !department.isActive) {
        return NextResponse.json(
          { error: 'Reparto non valido o non attivo' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        departmentId: validatedData.departmentId,
        departmentRole: validatedData.departmentRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        departmentRole: true,
        createdAt: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          }
        },
      },
    })

    // Log audit action
    await auditHelpers.logUserCreate(adminUser.user.id, adminUser.user.email, user, request)

    return NextResponse.json({
      message: 'Utente creato con successo',
      user
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}