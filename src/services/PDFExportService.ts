import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

export interface ODLForPDF {
  id: string
  odlNumber: string
  qrCode?: string | null
  status: string
  priority: string
  part: {
    partNumber: string
    description: string
  }
  currentDepartment?: {
    name: string
  } | null
  createdAt: string
  quantity?: number
  expectedCompletionDate?: string | null
}

export interface PDFExportOptions {
  includeQR?: boolean
  pageFormat?: 'A4' | 'A3' | 'letter'
  orientation?: 'portrait' | 'landscape'
  itemsPerPage?: number
  title?: string
  showTimestamp?: boolean
  groupByDepartment?: boolean
}

export class PDFExportService {
  private static readonly DEFAULT_OPTIONS: PDFExportOptions = {
    includeQR: true,
    pageFormat: 'A4',
    orientation: 'portrait',
    itemsPerPage: 10,
    title: 'Report ODL',
    showTimestamp: true,
    groupByDepartment: false
  }

  /**
   * Genera PDF completo con lista ODL
   */
  static async generateODLReport(
    odls: ODLForPDF[], 
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.DEFAULT_OPTIONS, ...options }
    
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageFormat
    })

    // Setup PDF metadata
    pdf.setProperties({
      title: config.title,
      subject: 'Report ODL - Gestione Produzione',
      author: 'Gestione Produzione',
      creator: 'MES Sistema'
    })

    let yPosition = 20
    const pageHeight = pdf.internal.pageSize.height
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20

    // Header
    this.addHeader(pdf, config.title || 'Report ODL', yPosition)
    yPosition += 20

    // Timestamp
    if (config.showTimestamp) {
      pdf.setFontSize(10)
      pdf.setTextColor(100)
      pdf.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, margin, yPosition)
      yPosition += 10
    }

    // Summary stats
    yPosition = this.addSummaryStats(pdf, odls, yPosition, margin)
    yPosition += 10

    // Group ODLs if requested
    const groupedOdls = config.groupByDepartment 
      ? this.groupODLsByDepartment(odls)
      : { 'Tutti gli ODL': odls }

    // Process each group
    for (const [groupName, groupOdls] of Object.entries(groupedOdls)) {
      if (config.groupByDepartment && groupOdls.length > 0) {
        // Group header
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.setFontSize(14)
        pdf.setTextColor(0)
        pdf.text(groupName, margin, yPosition)
        yPosition += 15
      }

      // Process ODLs in this group
      for (let i = 0; i < groupOdls.length; i++) {
        const odl = groupOdls[i]
        
        // Check if new page needed
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = 20
        }

        yPosition = await this.addODLToPage(pdf, odl, yPosition, margin, config.includeQR || false)
        yPosition += 15
      }
      
      yPosition += 10 // Space between groups
    }

    // Footer on all pages
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      this.addFooter(pdf, i, totalPages)
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  }

  /**
   * Genera PDF specializzato per etichette QR
   */
  static async generateQRLabelsSheet(
    odls: ODLForPDF[],
    labelsPerPage: number = 12
  ): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4'
    })

    pdf.setProperties({
      title: 'QR Labels Sheet',
      subject: 'Etichette QR - Gestione Produzione',
      author: 'Gestione Produzione'
    })

    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const margin = 10
    const labelWidth = (pageWidth - 3 * margin) / 3
    const labelHeight = (pageHeight - 5 * margin) / 4
    const labelsPerRow = 3
    const rowsPerPage = 4

    let currentPage = 1
    let currentPosition = 0

    for (let i = 0; i < odls.length; i++) {
      const odl = odls[i]
      const row = Math.floor(currentPosition / labelsPerRow)
      const col = currentPosition % labelsPerRow

      // Calculate position
      const x = margin + col * (labelWidth + margin / 2)
      const y = margin + row * (labelHeight + margin / 2)

      // Add new page if needed
      if (currentPosition >= labelsPerPage) {
        pdf.addPage()
        currentPage++
        currentPosition = 0
        continue
      }

      await this.addQRLabel(pdf, odl, x, y, labelWidth, labelHeight)
      currentPosition++
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  }

  /**
   * Esporta singolo ODL con QR in formato carta
   */
  static async generateSingleODLCard(odl: ODLForPDF): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // Formato card personalizzato
    })

    const cardWidth = 100
    const cardHeight = 150
    const margin = 10

    // Border
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.rect(5, 5, cardWidth - 10, cardHeight - 10)

    // ODL Number (header)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(odl.odlNumber, cardWidth / 2, 20, { align: 'center' })

    // QR Code (center)
    if (odl.qrCode) {
      try {
        const qrSize = 40
        const qrX = (cardWidth - qrSize) / 2
        const qrY = 30
        
        // Generate QR data structure
        const qrData = {
          type: 'ODL',
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          timestamp: new Date().toISOString(),
          status: odl.status
        }
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: qrSize * 8, // High resolution for card printing
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        })
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
      } catch (error) {
        console.error('Error adding QR to PDF:', error)
        // Fallback: text placeholder
        pdf.setFontSize(10)
        pdf.text('QR Code', cardWidth / 2, 50, { align: 'center' })
      }
    }

    // Part info (bottom)
    let yPos = 80
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(odl.part.partNumber, cardWidth / 2, yPos, { align: 'center' })
    
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const description = this.wrapText(pdf, odl.part.description, cardWidth - 20)
    description.forEach(line => {
      pdf.text(line, cardWidth / 2, yPos, { align: 'center' })
      yPos += 6
    })

    // Status and priority
    yPos += 5
    pdf.setFontSize(8)
    pdf.text(`${odl.priority} | ${odl.status}`, cardWidth / 2, yPos, { align: 'center' })

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  }

  // Helper methods
  private static addHeader(pdf: jsPDF, title: string, yPos: number): void {
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0)
    pdf.text(title, pdf.internal.pageSize.width / 2, yPos, { align: 'center' })
    
    // Underline
    const titleWidth = pdf.getTextWidth(title)
    const centerX = pdf.internal.pageSize.width / 2
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(centerX - titleWidth / 2, yPos + 2, centerX + titleWidth / 2, yPos + 2)
  }

  private static addSummaryStats(pdf: jsPDF, odls: ODLForPDF[], yPos: number, margin: number): number {
    const stats = {
      total: odls.length,
      withQR: odls.filter(o => o.qrCode).length,
      byStatus: this.getStatusCounts(odls),
      byPriority: this.getPriorityCounts(odls)
    }

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Riepilogo:', margin, yPos)
    yPos += 8

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Totale ODL: ${stats.total}`, margin, yPos)
    pdf.text(`Con QR Code: ${stats.withQR}`, margin + 60, yPos)
    yPos += 6

    // Status breakdown
    Object.entries(stats.byStatus).forEach(([status, count], index) => {
      const x = margin + (index * 50)
      pdf.text(`${status}: ${count}`, x, yPos)
    })
    yPos += 6

    return yPos
  }

  private static async addODLToPage(
    pdf: jsPDF, 
    odl: ODLForPDF, 
    yPos: number, 
    margin: number,
    includeQR: boolean
  ): Promise<number> {
    const startY = yPos

    // ODL header
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(odl.odlNumber, margin, yPos)
    
    // Status and priority badges
    const badgeX = margin + 80
    pdf.setFontSize(8)
    pdf.setDrawColor(0)
    pdf.setFillColor(200, 200, 200)
    pdf.rect(badgeX, yPos - 3, 25, 6, 'F')
    pdf.text(odl.priority, badgeX + 2, yPos)
    
    pdf.setFillColor(150, 150, 150)
    pdf.rect(badgeX + 30, yPos - 3, 35, 6, 'F')
    pdf.text(odl.status.replace('_', ' '), badgeX + 32, yPos)
    
    yPos += 8

    // Part info
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Parte: ${odl.part.partNumber}`, margin, yPos)
    yPos += 5
    pdf.text(`Descrizione: ${odl.part.description}`, margin, yPos)
    yPos += 5

    // Additional info
    if (odl.quantity) {
      pdf.text(`Quantità: ${odl.quantity}`, margin, yPos)
      yPos += 5
    }

    if (odl.currentDepartment) {
      pdf.text(`Reparto: ${odl.currentDepartment.name}`, margin, yPos)
      yPos += 5
    }

    // QR Code (if requested and available)
    if (includeQR && odl.qrCode) {
      try {
        // Generate QR data structure
        const qrData = {
          type: 'ODL',
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          timestamp: new Date().toISOString(),
          status: odl.status
        }
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 80,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        })
        pdf.addImage(qrDataUrl, 'PNG', margin + 120, startY, 20, 20)
      } catch (error) {
        console.error('Error generating QR for PDF:', error)
        pdf.text('QR Code disponibile', margin + 120, startY + 10)
      }
    }

    return yPos
  }

  private static async addQRLabel(
    pdf: jsPDF,
    odl: ODLForPDF,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    // Label border
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.3)
    pdf.rect(x, y, width, height)

    // ODL Number
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(odl.odlNumber, x + width / 2, y + 8, { align: 'center' })

    // QR Code (centro)
    const qrSize = Math.min(width, height) * 0.4
    const qrX = x + (width - qrSize) / 2
    const qrY = y + 15
    
    if (odl.qrCode) {
      try {
        // Generate QR data structure
        const qrData = {
          type: 'ODL',
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          timestamp: new Date().toISOString(),
          status: odl.status
        }
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: Math.floor(qrSize * 10), // Higher resolution for print
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        })
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
      } catch (error) {
        console.error('Error generating QR for label:', error)
        pdf.setDrawColor(200)
        pdf.rect(qrX, qrY, qrSize, qrSize)
        pdf.text('ERROR', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' })
      }
    } else {
      pdf.setDrawColor(200)
      pdf.rect(qrX, qrY, qrSize, qrSize)
      pdf.text('N/A', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' })
    }

    // Part info (bottom)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const bottomY = y + height - 10
    pdf.text(odl.part.partNumber, x + width / 2, bottomY, { align: 'center' })
    pdf.text(odl.priority, x + width / 2, bottomY + 4, { align: 'center' })
  }

  private static addFooter(pdf: jsPDF, pageNum: number, totalPages: number): void {
    const pageHeight = pdf.internal.pageSize.height
    const pageWidth = pdf.internal.pageSize.width
    
    pdf.setFontSize(8)
    pdf.setTextColor(100)
    pdf.text(
      `Pagina ${pageNum} di ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    
    pdf.text(
      'Gestione Produzione - Sistema di gestione produzione',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    )
  }

  private static groupODLsByDepartment(odls: ODLForPDF[]): Record<string, ODLForPDF[]> {
    return odls.reduce((groups, odl) => {
      const dept = odl.currentDepartment?.name || 'Nessun Reparto'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(odl)
      return groups
    }, {} as Record<string, ODLForPDF[]>)
  }

  private static getStatusCounts(odls: ODLForPDF[]): Record<string, number> {
    return odls.reduce((counts, odl) => {
      counts[odl.status] = (counts[odl.status] || 0) + 1
      return counts
    }, {} as Record<string, number>)
  }

  private static getPriorityCounts(odls: ODLForPDF[]): Record<string, number> {
    return odls.reduce((counts, odl) => {
      counts[odl.priority] = (counts[odl.priority] || 0) + 1
      return counts
    }, {} as Record<string, number>)
  }

  private static wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = pdf.getTextWidth(testLine)
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }
}

// Utility functions for easy access
export const PDFUtils = {
  /**
   * Quick export for ODL list
   */
  async exportODLList(odls: ODLForPDF[], filename?: string): Promise<void> {
    const pdf = await PDFExportService.generateODLReport(odls)
    this.downloadBlob(pdf, filename || `odl-report-${new Date().toISOString().split('T')[0]}.pdf`)
  },

  /**
   * Quick export for QR labels
   */
  async exportQRLabels(odls: ODLForPDF[], filename?: string): Promise<void> {
    const pdf = await PDFExportService.generateQRLabelsSheet(odls)
    this.downloadBlob(pdf, filename || `qr-labels-${new Date().toISOString().split('T')[0]}.pdf`)
  },

  /**
   * Download blob helper
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}