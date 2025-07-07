import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-node'
import { z } from 'zod'
import { PDFExportService, type ODLForPDF } from '@/services/PDFExportService'

export const runtime = 'nodejs'

const pdfRequestSchema = z.object({
  type: z.enum(['odl-report', 'qr-labels', 'single-odl']),
  odlIds: z.array(z.string()).optional(),
  options: z.object({
    includeQR: z.boolean().optional(),
    pageFormat: z.enum(['A4', 'A3', 'letter']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    title: z.string().optional(),
    groupByDepartment: z.boolean().optional()
  }).optional(),
  // For single ODL export
  odlId: z.string().optional()
})

// POST /api/reports/pdf - Genera report PDF
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const validation = pdfRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati richiesta non validi', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { type, odlIds, options, odlId } = validation.data

    let odls: ODLForPDF[] = []

    // Fetch ODL data based on request type
    if (type === 'single-odl' && odlId) {
      // Single ODL
      const odl = await prisma.oDL.findUnique({
        where: { id: odlId },
        select: {
          id: true,
          odlNumber: true,
          qrCode: true,
          status: true,
          priority: true,
          quantity: true,
          expectedCompletionDate: true,
          createdAt: true,
          part: {
            select: {
              partNumber: true,
              description: true
            }
          },
          events: {
            where: { eventType: 'ENTRY' },
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              department: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      if (!odl) {
        return NextResponse.json(
          { error: 'ODL non trovato' },
          { status: 404 }
        )
      }

      odls = [{
        ...odl,
        createdAt: odl.createdAt.toISOString(),
        expectedCompletionDate: odl.expectedCompletionDate?.toISOString() || null,
        currentDepartment: odl.events[0]?.department || null
      }]
    } else if (odlIds && odlIds.length > 0) {
      // Multiple ODLs by IDs
      const rawOdls = await prisma.oDL.findMany({
        where: {
          id: { in: odlIds }
        },
        select: {
          id: true,
          odlNumber: true,
          qrCode: true,
          status: true,
          priority: true,
          quantity: true,
          expectedCompletionDate: true,
          createdAt: true,
          part: {
            select: {
              partNumber: true,
              description: true
            }
          },
          events: {
            where: { eventType: 'ENTRY' },
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              department: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      })
      
      odls = rawOdls.map(odl => ({
        ...odl,
        createdAt: odl.createdAt.toISOString(),
        expectedCompletionDate: odl.expectedCompletionDate?.toISOString() || null,
        currentDepartment: odl.events[0]?.department || null
      }))
    } else {
      // All ODLs (with potential filters based on user role)
      const whereClause: any = {}
      
      // If not admin, filter by user's department through events
      if (session.user.role !== 'ADMIN' && session.user.departmentId) {
        whereClause.events = {
          some: {
            eventType: 'ENTRY',
            departmentId: session.user.departmentId
          }
        }
      }

      const rawOdls = await prisma.oDL.findMany({
        where: whereClause,
        select: {
          id: true,
          odlNumber: true,
          qrCode: true,
          status: true,
          priority: true,
          quantity: true,
          expectedCompletionDate: true,
          createdAt: true,
          part: {
            select: {
              partNumber: true,
              description: true
            }
          },
          events: {
            where: { eventType: 'ENTRY' },
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              department: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 100 // Limit for performance
      })
      
      odls = rawOdls.map(odl => ({
        ...odl,
        createdAt: odl.createdAt.toISOString(),
        expectedCompletionDate: odl.expectedCompletionDate?.toISOString() || null,
        currentDepartment: odl.events[0]?.department || null
      }))
    }

    if (odls.length === 0) {
      return NextResponse.json(
        { error: 'Nessun ODL trovato per l\'export' },
        { status: 404 }
      )
    }

    // Generate PDF based on type
    let pdfBlob: Blob
    let filename: string
    
    const timestamp = new Date().toISOString().split('T')[0]

    switch (type) {
      case 'single-odl':
        pdfBlob = await PDFExportService.generateSingleODLCard(odls[0])
        filename = `odl-${odls[0].odlNumber}-${timestamp}.pdf`
        break
        
      case 'qr-labels':
        pdfBlob = await PDFExportService.generateQRLabelsSheet(odls)
        filename = `qr-labels-${timestamp}.pdf`
        break
        
      case 'odl-report':
      default:
        pdfBlob = await PDFExportService.generateODLReport(odls, options)
        filename = `odl-report-${timestamp}.pdf`
        break
    }

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      { 
        error: 'Errore generazione PDF',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

// GET /api/reports/pdf/templates - Lista template disponibili
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const templates = [
      {
        id: 'odl-report',
        name: 'Report ODL Completo',
        description: 'Lista dettagliata di tutti gli ODL con informazioni complete',
        options: {
          includeQR: true,
          pageFormat: 'A4',
          orientation: 'portrait',
          groupByDepartment: false
        }
      },
      {
        id: 'qr-labels',
        name: 'Etichette QR',
        description: 'Foglio di etichette QR per stampa su stampante standard',
        options: {
          pageFormat: 'A4',
          orientation: 'portrait',
          itemsPerPage: 12
        }
      },
      {
        id: 'single-odl',
        name: 'Card ODL Singolo',
        description: 'Card formato tessera per singolo ODL con QR',
        options: {
          includeQR: true,
          pageFormat: 'card'
        }
      },
      {
        id: 'department-report',
        name: 'Report per Reparto',
        description: 'Report ODL raggruppati per reparto',
        options: {
          includeQR: false,
          pageFormat: 'A4',
          orientation: 'portrait',
          groupByDepartment: true
        }
      }
    ]

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching PDF templates:', error)
    return NextResponse.json(
      { error: 'Errore caricamento template' },
      { status: 500 }
    )
  }
}