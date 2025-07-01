import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { auditHelpers } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const users = await prisma.user.findMany({
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
            name: true,
            code: true,
            type: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Nome',
      'Email',
      'Ruolo Sistema',
      'Reparto',
      'Codice Reparto',
      'Tipo Reparto',
      'Ruolo Reparto',
      'Stato',
      'Data Creazione'
    ]

    const csvRows = users.map(user => [
      user.id,
      user.name || '',
      user.email,
      user.role,
      user.department?.name || '',
      user.department?.code || '',
      user.department?.type || '',
      user.departmentRole || '',
      user.isActive ? 'Attivo' : 'Disattivato',
      new Date(user.createdAt).toLocaleDateString('it-IT')
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      )
    ].join('\n')

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Log audit action
    await auditHelpers.logUserExport(adminUser.user.id, adminUser.user.email, request)

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="utenti_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export users error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}