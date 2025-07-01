import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { UserRole, DepartmentRole } from '@prisma/client'

const updateUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().nullable().optional(),
  departmentRole: z.nativeEnum(DepartmentRole).nullable().optional(),
  isActive: z.boolean(),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri').optional(),
}).refine((data) => {
  // Use the same validation logic as updateUserRoleSchema
  if (data.role === UserRole.ADMIN) {
    return !data.departmentId && !data.departmentRole
  }
  
  if (data.role === UserRole.OPERATOR) {
    return data.departmentId && data.departmentRole
  }
  
  return true
}, {
  message: "Configurazione ruoli non valida",
  path: ["role"],
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Prevent self-modification of critical fields
    if (id === session.user.id) {
      // Admin can't disable their own account or change their role
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true, isActive: true }
      })

      if (currentUser?.role === UserRole.ADMIN) {
        if (validatedData.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { error: 'Non puoi modificare il tuo ruolo di amministratore' },
            { status: 400 }
          )
        }
        if (!validatedData.isActive) {
          return NextResponse.json(
            { error: 'Non puoi disattivare il tuo account' },
            { status: 400 }
          )
        }
      }
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        NOT: { id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già in uso da un altro utente' },
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

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      role: UserRole;
      departmentId?: string | null;
      departmentRole?: DepartmentRole | null;
      isActive: boolean;
      password?: string;
    } = {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      isActive: validatedData.isActive,
    }

    // Handle department assignment
    if (validatedData.departmentId !== undefined) {
      updateData.departmentId = validatedData.departmentId
    }
    
    if (validatedData.departmentRole !== undefined) {
      updateData.departmentRole = validatedData.departmentRole
    }

    // Add password if provided
    if (validatedData.password) {
      updateData.password = await hash(validatedData.password, 12)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      message: 'Utente aggiornato con successo',
      user
    })

  } catch (error) {
    console.error('Update user error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Check if it's the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Non puoi eliminare l\'ultimo amministratore' },
          { status: 400 }
        )
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Utente eliminato con successo'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}