import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { ToolService } from '@/domains/core/services/ToolService'
import { auditHelpers } from '@/lib/audit-logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const tools = await ToolService.findAll()

    // Convert to CSV format
    const csvHeaders = [
      'Part Number Tool',
      'Descrizione',
      'Base (mm)',
      'Altezza (mm)',
      'Peso (kg)',
      'Materiale',
      'Numero Valvole',
      'Stato',
      'Data Creazione',
      'Ultimo Aggiornamento'
    ]

    const csvRows = tools.map(tool => [
      tool.toolPartNumber,
      tool.description || '',
      tool.base,
      tool.height,
      tool.weight || '',
      tool.material || '',
      tool.valveCount,
      tool.isActive ? 'Attivo' : 'Disattivato',
      new Date(tool.createdAt).toLocaleDateString('it-IT'),
      new Date(tool.updatedAt).toLocaleDateString('it-IT')
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
    await auditHelpers.logDataExport(
      adminUser.user.id, 
      adminUser.user.email, 
      'TOOLS_EXPORT',
      `Export di ${tools.length} tools`,
      request
    )

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tools_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export tools error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}