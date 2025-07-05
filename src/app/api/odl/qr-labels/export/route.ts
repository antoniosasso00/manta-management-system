import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-node'
import { z } from 'zod'

const exportRequestSchema = z.object({
  odlIds: z.array(z.string()).min(1, 'Almeno un ODL richiesto')
})

// POST /api/odl/qr-labels/export - Esporta QR labels selezionati
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const validation = exportRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati richiesta non validi', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { odlIds } = validation.data

    // Fetch ODL data
    const odls = await prisma.oDL.findMany({
      where: {
        id: { in: odlIds }
      },
      select: {
        id: true,
        odlNumber: true,
        qrCode: true,
        status: true,
        priority: true,
        part: {
          select: {
            partNumber: true,
            description: true
          }
        },
        currentDepartment: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { odlNumber: 'asc' }
      ]
    })

    if (odls.length === 0) {
      return NextResponse.json(
        { error: 'Nessun ODL trovato' },
        { status: 404 }
      )
    }

    // Generate QR labels HTML
    const qrLabelsHtml = odls.map(odl => `
      <div class="qr-label">
        <div class="qr-header">
          <div class="odl-number">${odl.odlNumber}</div>
          <div class="status-badges">
            <span class="priority-badge priority-${odl.priority.toLowerCase()}">${odl.priority}</span>
            <span class="status-badge">${odl.status.replace('_', ' ')}</span>
          </div>
        </div>
        <div class="qr-code">
          ${odl.qrCode || '<div class="no-qr">QR non disponibile</div>'}
        </div>
        <div class="part-info">
          <div class="part-number">${odl.part.partNumber}</div>
          <div class="part-description">${odl.part.description}</div>
          ${odl.currentDepartment ? `<div class="department">Rep: ${odl.currentDepartment.name}</div>` : ''}
        </div>
      </div>
    `).join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Labels Export - ${odls.length} ODL</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              background: white;
              padding: 10mm;
            }
            .export-header {
              text-align: center;
              margin-bottom: 10mm;
              border-bottom: 2px solid #333;
              padding-bottom: 5mm;
            }
            .export-info {
              margin-bottom: 5mm;
              font-size: 10px;
              color: #666;
            }
            .qr-labels-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 5mm;
              page-break-inside: avoid;
            }
            .qr-label {
              border: 1px solid #333;
              padding: 3mm;
              text-align: center;
              background: white;
              page-break-inside: avoid;
              min-height: 60mm;
              width: 60mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .qr-header {
              margin-bottom: 2mm;
            }
            .odl-number {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .status-badges {
              display: flex;
              justify-content: center;
              gap: 2mm;
              margin-bottom: 2mm;
            }
            .priority-badge, .status-badge {
              font-size: 8px;
              padding: 1mm 2mm;
              border-radius: 2mm;
              color: white;
              font-weight: bold;
            }
            .priority-high { background: #f44336; }
            .priority-medium { background: #ff9800; }
            .priority-low { background: #4caf50; }
            .priority-normal { background: #2196f3; }
            .status-badge { background: #666; }
            .qr-code {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 2mm 0;
            }
            .qr-code svg {
              width: 35mm !important;
              height: 35mm !important;
            }
            .no-qr {
              width: 35mm;
              height: 35mm;
              border: 1px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #666;
            }
            .part-info {
              font-size: 9px;
              line-height: 1.2;
            }
            .part-number {
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .part-description {
              color: #666;
              margin-bottom: 1mm;
              max-height: 6mm;
              overflow: hidden;
            }
            .department {
              font-size: 8px;
              color: #888;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
              .export-header { margin-bottom: 5mm; }
              .qr-labels-grid { gap: 3mm; }
              .qr-label { min-height: 55mm; width: 55mm; }
              .qr-code svg { width: 30mm !important; height: 30mm !important; }
              .no-qr { width: 30mm; height: 30mm; }
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <div class="export-header">
            <h1>QR Labels Export</h1>
            <div class="export-info">
              <div>Data: ${new Date().toLocaleDateString('it-IT')}</div>
              <div>Totale ODL: ${odls.length}</div>
              <div>Generato da: ${session.user.name}</div>
            </div>
          </div>
          
          <div class="qr-labels-grid">
            ${qrLabelsHtml}
          </div>
          
          <div style="margin-top: 10mm; text-align: center; font-size: 10px; color: #666;">
            <p>MES Aerospazio - Sistema di gestione produzione</p>
            <p>Export generato il ${new Date().toLocaleString('it-IT')}</p>
          </div>
        </body>
      </html>
    `

    // Return HTML file
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="qr-labels-${new Date().toISOString().split('T')[0]}.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Error exporting QR labels:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}