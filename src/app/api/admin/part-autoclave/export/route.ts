import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { PartAutoclaveService } from '@/domains/autoclave/services/PartAutoclaveService'
import { auditHelpers } from '@/lib/audit-logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const configs = await PartAutoclaveService.findAll()

    // Convert to CSV format
    const csvHeaders = [
      'Part Number',
      'Ciclo Cura',
      'Valvole/Vacuum Lines',
      'Tempo Setup (min)',
      'Posizione Carico',
      'Note',
      'Data Creazione',
      'Ultimo Aggiornamento'
    ]

    const csvRows = configs.map(config => [
      config.part?.partNumber || '',
      config.curingCycle?.name || '',
      config.vacuumLines,
      config.setupTime || '',
      config.loadPosition || '',
      config.notes || '',
      new Date(config.createdAt).toLocaleDateString('it-IT'),
      new Date(config.updatedAt).toLocaleDateString('it-IT')
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
      'PART_AUTOCLAVE_EXPORT',
      `Export di ${configs.length} configurazioni parti autoclavi`,
      request
    )

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="part_autoclave_config_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export part autoclave config error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}