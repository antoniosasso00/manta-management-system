import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { auditHelpers } from '@/lib/audit-logger'

const importUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'OPERATOR']),
  departmentCode: z.string().optional(),
  departmentRole: z.enum(['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE']).optional(),
})

const bulkImportSchema = z.object({
  users: z.array(importUserSchema),
  skipDuplicates: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const { users, skipDuplicates } = bulkImportSchema.parse(body)

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>
    }

    // Get all departments for code lookup
    const departments = await prisma.department.findMany({
      select: { id: true, code: true, isActive: true }
    })
    const departmentMap = new Map(departments.map(d => [d.code, d]))

    for (let i = 0; i < users.length; i++) {
      const userData = users[i]
      
      try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (existingUser) {
          if (skipDuplicates) {
            results.skipped++
            continue
          } else {
            results.errors.push({
              row: i + 1,
              email: userData.email,
              error: 'Email già esistente'
            })
            continue
          }
        }

        // Validate department if provided
        let departmentId: string | null = null
        if (userData.departmentCode) {
          const department = departmentMap.get(userData.departmentCode)
          if (!department || !department.isActive) {
            results.errors.push({
              row: i + 1,
              email: userData.email,
              error: `Reparto '${userData.departmentCode}' non trovato o non attivo`
            })
            continue
          }
          departmentId = department.id
        }

        // Hash password
        const hashedPassword = await hash(userData.password, 12)

        // Create user
        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            departmentId,
            departmentRole: userData.departmentRole,
            isActive: true,
          }
        })

        results.created++

      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error)
        results.errors.push({
          row: i + 1,
          email: userData.email,
          error: 'Errore durante la creazione'
        })
      }
    }

    // Log audit action
    await auditHelpers.logUserImport(adminUser.user.id, adminUser.user.email, results, request)

    return NextResponse.json({
      message: `Import completato: ${results.created} creati, ${results.skipped} saltati, ${results.errors.length} errori`,
      results
    })

  } catch (error) {
    console.error('Import users error:', error)
    
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