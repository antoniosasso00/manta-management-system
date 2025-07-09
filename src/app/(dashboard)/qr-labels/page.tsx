'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material'
import {
  Print,
  Download,
  Refresh,
  CheckBox,
  CheckBoxOutlineBlank,
  QrCode2,
  PictureAsPdf,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  GridView as GridIcon,
  CheckCircle as CheckedIcon
} from '@mui/icons-material'
import { DataTable } from '@/components/atoms'
import type { DataTableProps } from '@/components/atoms/DataTable'
import { FilterPanel, FilterConfig, FilterValues } from '@/components/molecules'
import type { Column } from '@/components/atoms/DataTable'
import { useAuth } from '@/hooks/useAuth'
import QRCode from 'qrcode'

// Componente per generare QR code reali nell'anteprima
function PreviewQRCode({ odl, size, errorCorrection }: { 
  odl: ODLForQR; 
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  
  useEffect(() => {
    const generateQR = async () => {
      const qrData = {
        type: 'ODL',
        id: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        timestamp: new Date().toISOString(),
        currentDepartment: odl.currentDepartment?.name || 'CREATED',
        status: odl.status
      }
      
      try {
        const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: size === 'XLARGE' ? 200 : size === 'LARGE' ? 160 : size === 'MEDIUM' ? 120 : 80,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: errorCorrection,
          type: 'image/png',
          rendererOpts: { quality: 1.0 }
        })
        setQrDataUrl(dataUrl)
      } catch (error) {
        console.error('Error generating preview QR:', error)
        // Fallback per preview
        try {
          const fallbackUrl = await QRCode.toDataURL(odl.odlNumber, {
            width: 100,
            margin: 1,
            errorCorrectionLevel: 'M'
          })
          setQrDataUrl(fallbackUrl)
        } catch (fallbackError) {
          console.error('Preview fallback failed:', fallbackError)
        }
      }
    }
    
    generateQR()
  }, [odl, size, errorCorrection])
  
  if (!qrDataUrl) {
    return <CircularProgress size={20} />
  }
  
  return (
    <img 
      src={qrDataUrl} 
      alt={`QR ${odl.odlNumber}`}
      style={{ 
        width: '100%', 
        height: '100%',
        maxWidth: size === 'XLARGE' ? 60 : size === 'LARGE' ? 50 : size === 'MEDIUM' ? 40 : 30,
        maxHeight: size === 'XLARGE' ? 60 : size === 'LARGE' ? 50 : size === 'MEDIUM' ? 40 : 30
      }}
    />
  )
}

interface ODLForQR {
  [key: string]: any // ← AGGIUNGI QUESTO
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
  labelsPrinted?: boolean
  lastPrintedAt?: string
  printedBy?: string
}


interface PrintConfiguration {
  paperFormat: 'A4' | 'A5' | 'CUSTOM'
  matrixLayout: '1x2' | '2x2' | '2x3' | '3x3' | '3x4' | '4x4'
  qrSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  includePartDescription: boolean
  includeDepartment: boolean
  includeDateTime: boolean
  customQRPerPage?: number
  dpi: 300 | 600
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
}

interface PrintTemplate {
  id: string
  name: string
  configuration: PrintConfiguration
  isDefault: boolean
}

export default function QRLabelsPage() {
  const { user } = useAuth()
  const [odls, setOdls] = useState<ODLForQR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOdls, setSelectedOdls] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [printPreview, setPrintPreview] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
  
  // Print Configuration State
  const [configDialog, setConfigDialog] = useState(false)
  const [printConfig, setPrintConfig] = useState<PrintConfiguration>({
    paperFormat: 'A4',
    matrixLayout: '2x2',
    qrSize: 'MEDIUM',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    includePartDescription: true,
    includeDepartment: true,
    includeDateTime: true,
    dpi: 300,
    errorCorrection: 'H'
  })
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<string>('default')
  const [previewDialog, setPreviewDialog] = useState(false)

  // Fetch ODLs
  const fetchOdls = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterValues.status) params.append('status', filterValues.status as string)
      if (filterValues.priority) params.append('priority', filterValues.priority as string)
      if (filterValues.departmentId) params.append('departmentId', filterValues.departmentId as string)
      
      const response = await fetch(`/api/odl/qr-labels?${params}`)
      if (!response.ok) {
        throw new Error('Errore caricamento ODL')
      }
      
      const data = await response.json()
      setOdls(data)
    } catch (error) {
      console.error('Error fetching ODLs:', error)
      setError(error instanceof Error ? error.message : 'Errore caricamento ODL')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterValues])

  useEffect(() => {
    fetchOdls()
  }, [fetchOdls])

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOdls(new Set(odls.map(odl => odl.id)))
    } else {
      setSelectedOdls(new Set())
    }
  }

  const handleSelectOdl = (odlId: string, checked: boolean) => {
    const newSelected = new Set(selectedOdls)
    if (checked) {
      newSelected.add(odlId)
    } else {
      newSelected.delete(odlId)
    }
    setSelectedOdls(newSelected)
  }

  // Print handlers
  const handlePrintSelected = () => {
    const selectedOdlData = odls.filter(odl => selectedOdls.has(odl.id))
    if (selectedOdlData.length === 0) {
      setError('Seleziona almeno un ODL per la stampa')
      return
    }
    printQRLabels(selectedOdlData)
  }

  const handlePrintAll = () => {
    if (odls.length === 0) {
      setError('Nessun ODL disponibile per la stampa')
      return
    }
    printQRLabels(odls)
  }

  const printQRLabels = async (odlsToPrint: ODLForQR[]) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Generate QR codes for labels that don't have them
    const labelsWithQR = await Promise.all(
      odlsToPrint.map(async (odl) => {
        if (!odl.qrCode) {
          // Generate QR code on the fly
          const qrData = {
            type: 'ODL',
            id: odl.id,
            odlNumber: odl.odlNumber,
            partNumber: odl.part.partNumber,
            timestamp: new Date().toISOString(),
            currentDepartment: odl.currentDepartment?.name || 'CREATED',
            status: odl.status
          }
          
          try {
            const QRCode = (await import('qrcode')).default
            
            // Calcola dimensioni ottimali per stampa basate su DPI e dimensione QR
            const qrSizeMapping = { SMALL: 30, MEDIUM: 40, LARGE: 50, XLARGE: 60 }
            const qrMmSize = qrSizeMapping[printConfig.qrSize]
            const pixelSize = Math.floor((qrMmSize * printConfig.dpi) / 25.4) // Conversione mm to pixels
            
            const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
              width: pixelSize,
              margin: 4,  // Quiet zone di 4 moduli come da best practice
              color: { dark: '#000000', light: '#FFFFFF' },
              errorCorrectionLevel: printConfig.errorCorrection || 'H',  // Alto livello per ambiente industriale
              type: 'image/png',  // Formato esplicito
              rendererOpts: {
                quality: 1.0  // Qualità massima
              }
            })
            return { ...odl, qrCode: qrCodeDataUrl }
          } catch (error) {
            console.error('Error generating QR code for ODL:', odl.odlNumber, error)
            // Fallback: tenta generazione semplificata
            try {
              const QRCode = (await import('qrcode')).default
              const fallbackDataUrl = await QRCode.toDataURL(odl.odlNumber, {
                width: 200,
                margin: 2,
                errorCorrectionLevel: 'M'
              })
              return { ...odl, qrCode: fallbackDataUrl }
            } catch (fallbackError) {
              console.error('Fallback QR generation failed:', fallbackError)
              return odl
            }
          }
        }
        return odl
      })
    )

    const getMatrixDimensions = (layout: string) => {
      switch (layout) {
        case '1x2': return { cols: 1, rows: 2, total: 2 }
        case '2x2': return { cols: 2, rows: 2, total: 4 }
        case '2x3': return { cols: 2, rows: 3, total: 6 }
        case '3x3': return { cols: 3, rows: 3, total: 9 }
        case '3x4': return { cols: 3, rows: 4, total: 12 }
        case '4x4': return { cols: 4, rows: 4, total: 16 }
        default: return { cols: 2, rows: 2, total: 4 }
      }
    }

    const { cols } = getMatrixDimensions(printConfig.matrixLayout)
    // Dimensioni QR secondo best practices aerospaziali (minimo 20mm, ottimale 30-50mm)
    const qrSizes = { 
      SMALL: '30mm',    // Minimo consigliato per leggibilità industriale
      MEDIUM: '40mm',   // Dimensione standard
      LARGE: '50mm',    // Per scansioni a distanza
      XLARGE: '60mm'    // Per condizioni difficili
    }
    const labelSizes = { 
      SMALL: '70mm', 
      MEDIUM: '85mm', 
      LARGE: '100mm',
      XLARGE: '120mm'
    }

    const currentDateTime = new Date().toLocaleString('it-IT')

    const qrLabelsHtml = labelsWithQR.map(odl => `
      <div class="qr-label">
        <div class="qr-header">
          <div class="odl-number">${odl.odlNumber}</div>
          <div class="status-badges">
            <span class="priority-badge priority-${odl.priority.toLowerCase()}">${odl.priority}</span>
            <span class="status-badge">${odl.status.replace('_', ' ')}</span>
          </div>
        </div>
        <div class="qr-code">
          ${odl.qrCode ? 
            `<img src="${odl.qrCode}" alt="QR ${odl.odlNumber}" class="qr-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div class="no-qr" style="display:none;">QR non disponibile</div>` : 
            '<div class="no-qr">QR non disponibile</div>'
          }
        </div>
        <div class="part-info">
          <div class="part-number">${odl.part.partNumber}</div>
          ${printConfig.includePartDescription ? 
            `<div class="part-description">${odl.part.description}</div>` : ''
          }
          ${printConfig.includeDepartment ? 
            `<div class="department">Reparto: ${odl.currentDepartment?.name || 'DA ASSEGNARE'}</div>` : ''
          }
          <div class="tracking-info">Stato: ${odl.status.replace(/_/g, ' ')}</div>
          ${printConfig.includeDateTime ? 
            `<div class="datetime">Stampato: ${currentDateTime}</div>` : ''
          }
        </div>
      </div>
    `).join('')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Labels - ${labelsWithQR.length} ODL - ${printConfig.matrixLayout}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              background: white;
              padding: ${printConfig.margins.top}mm ${printConfig.margins.right}mm ${printConfig.margins.bottom}mm ${printConfig.margins.left}mm;
            }
            .qr-labels-grid {
              display: grid;
              grid-template-columns: repeat(${cols}, 1fr);
              gap: 5mm;  /* Maggiore spazio tra etichette per evitare sovrapposizioni */
              page-break-inside: avoid;
              padding: 0;
            }
            .qr-label {
              border: 2px solid #000;  /* Bordo più spesso per delimitazione chiara */
              padding: 4mm;  /* Padding interno maggiore per quiet zone */
              text-align: center;
              background: white;
              page-break-inside: avoid;
              height: ${labelSizes[printConfig.qrSize]};
              width: ${labelSizes[printConfig.qrSize]};
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              aspect-ratio: 1;
              position: relative;
              border-radius: 3mm;  /* Angoli arrotondati per taglio manuale */
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
            .priority-urgent { background: #d32f2f; }
            .priority-medium { background: #ff9800; }
            .priority-normal { background: #2196f3; }
            .priority-low { background: #4caf50; }
            .status-badge { background: #666; }
            .qr-code {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 3mm 0;  /* Maggiore margine per quiet zone */
              min-height: ${qrSizes[printConfig.qrSize]};
              background: white;  /* Sfondo bianco garantito */
              padding: 4mm;  /* Quiet zone di 4mm intorno al QR */
              border-radius: 2mm;
            }
            .qr-image {
              width: ${qrSizes[printConfig.qrSize]} !important;
              height: ${qrSizes[printConfig.qrSize]} !important;
              object-fit: contain;
              image-rendering: crisp-edges;  /* Rendering nitido per QR */
              image-rendering: -webkit-optimize-contrast;
              image-rendering: pixelated;
              max-width: 100% !important;
              max-height: 100% !important;
              display: block !important;
              margin: 0 auto !important;
            }
            .no-qr {
              width: ${qrSizes[printConfig.qrSize]};
              height: ${qrSizes[printConfig.qrSize]};
              border: 1px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #666;
              background: #f9f9f9;
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
              max-height: 8mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 8px;
            }
            .department {
              font-size: 8px;
              color: #888;
              margin-bottom: 1mm;
            }
            .tracking-info {
              font-size: 9px;
              font-weight: bold;
              color: #000;
              margin-bottom: 1mm;
              text-transform: uppercase;
            }
            .datetime {
              font-size: 7px;
              color: #aaa;
            }
            @media print {
              body { 
                margin: ${printConfig.margins.top}mm ${printConfig.margins.right}mm ${printConfig.margins.bottom}mm ${printConfig.margins.left}mm;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              .qr-labels-grid { 
                gap: 5mm;
                padding: 0;
              }
              .qr-label {
                border: 2px solid #000;
                padding: 4mm;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .qr-image {
                filter: contrast(2) brightness(1.1);  /* Aumenta contrasto e luminosità per stampa */
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                image-rendering: crisp-edges !important;
              }
              .qr-code {
                background: white !important;
                border: 1px solid #000 !important;
              }
            }
            @page {
              size: ${printConfig.paperFormat};
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="qr-labels-grid">
            ${qrLabelsHtml}
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()

    // Mark ODLs as printed
    await markAsPrinted(labelsWithQR.map(odl => odl.id))
  }

  const markAsPrinted = async (odlIds: string[]) => {
    try {
      await fetch('/api/odl/qr-labels/mark-printed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          odlIds,
          printedBy: user?.name,
          printedAt: new Date().toISOString()
        })
      })
      
      // Refresh ODL list to show updated status
      fetchOdls()
    } catch (error) {
      console.error('Error marking as printed:', error)
    }
  }

  // Template management
  const saveTemplate = async (name: string) => {
    const newTemplate: PrintTemplate = {
      id: Date.now().toString(),
      name,
      configuration: { ...printConfig },
      isDefault: false
    }
    
    setTemplates(prev => [...prev, newTemplate])
    setCurrentTemplate(newTemplate.id)
    
    // In production, this would save to the backend
    localStorage.setItem('qr-label-templates', JSON.stringify([...templates, newTemplate]))
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setPrintConfig(template.configuration)
      setCurrentTemplate(templateId)
    }
  }

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId)
    setTemplates(updatedTemplates)
    localStorage.setItem('qr-label-templates', JSON.stringify(updatedTemplates))
    
    if (currentTemplate === templateId) {
      setCurrentTemplate('default')
    }
  }

  // Load templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('qr-label-templates')
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates)
        setTemplates(parsed)
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }
  }, [])

  // Export handlers
  const handleExportLabels = async () => {
    const selectedOdlData = odls.filter(odl => selectedOdls.has(odl.id))
    if (selectedOdlData.length === 0) {
      setError('Seleziona almeno un ODL per l\'esportazione')
      return
    }

    try {
      const response = await fetch('/api/odl/qr-labels/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odlIds: Array.from(selectedOdls) })
      })

      if (!response.ok) {
        throw new Error('Errore esportazione')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr-labels-${new Date().toISOString().split('T')[0]}.html`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      setError('Errore durante l\'esportazione')
    }
  }

  // PDF Export handlers
  const handleExportPDF = async (type: 'qr-labels' | 'odl-report') => {
    const selectedOdlData = odls.filter(odl => selectedOdls.has(odl.id))
    if (selectedOdlData.length === 0) {
      setError('Seleziona almeno un ODL per l\'esportazione PDF')
      return
    }

    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type,
          odlIds: Array.from(selectedOdls),
          options: {
            includeQR: type === 'qr-labels',
            pageFormat: 'A4',
            orientation: 'portrait',
            title: type === 'qr-labels' ? 'Etichette QR' : 'Report ODL Selezionati'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Errore generazione PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF Export error:', error)
      setError('Errore durante l\'esportazione PDF')
    }
  }

  // Table configuration
  const columns: Column<ODLForQR>[] = [
    {
      id: 'id' as keyof ODLForQR,
      label: '',
      minWidth: 60,
      format: (_value, row) => (
        <Checkbox
          checked={selectedOdls.has(row.id)}
          onChange={(e) => handleSelectOdl(row.id, e.target.checked)}
          size="small"
        />
      )
    },
    {
      id: 'odlNumber',
      label: 'ODL',
      minWidth: 120,
      format: (value) => <Typography variant="body2" fontWeight={600}>{String(value)}</Typography>
    },
    {
      id: 'part',
      label: 'Parte',
      minWidth: 200,
      format: (_value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {row.part.partNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.part.description}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Stato',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={String(value).replace('_', ' ')}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      id: 'priority',
      label: 'Priorità',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={String(value)}
          size="small"
          color={value === 'HIGH' ? 'error' : value === 'MEDIUM' ? 'warning' : 'success'}
          variant="filled"
        />
      )
    },
    {
      id: 'qrCode',
      label: 'QR',
      minWidth: 80,
      format: (value) => (
        <Tooltip title={value ? 'QR disponibile' : 'QR non disponibile'}>
          <QrCode2 color={value ? 'primary' : 'disabled'} />
        </Tooltip>
      )
    },
    {
      id: 'labelsPrinted',
      label: 'Stampato',
      minWidth: 100,
      format: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {row.labelsPrinted ? (
            <Tooltip title={`Stampato da ${row.printedBy || 'N/A'} il ${row.lastPrintedAt ? new Date(row.lastPrintedAt).toLocaleDateString('it-IT') : 'N/A'}`}>
              <Badge color="success" variant="dot">
                <CheckedIcon color="success" />
              </Badge>
            </Tooltip>
          ) : (
            <Tooltip title="Non ancora stampato">
              <Chip label="Da stampare" size="small" variant="outlined" color="warning" />
            </Tooltip>
          )}
        </Box>
      )
    }
  ]

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Stato',
      type: 'select',
      options: [
        { value: 'CREATED', label: 'Creato' },
        { value: 'IN_CLEANROOM', label: 'In Clean Room' },
        { value: 'IN_AUTOCLAVE', label: 'In Autoclave' },
        { value: 'COMPLETED', label: 'Completato' }
      ]
    },
    {
      id: 'priority',
      label: 'Priorità',
      type: 'select',
      options: [
        { value: 'HIGH', label: 'Alta' },
        { value: 'MEDIUM', label: 'Media' },
        { value: 'NORMAL', label: 'Normale' },
        { value: 'LOW', label: 'Bassa' }
      ]
    }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stampa QR Labels - Tracking Produzione
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Genera etichette QR per il tracking degli ODL attraverso i reparti produttivi
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>IMPORTANTE</strong>: Questi QR code vengono utilizzati per registrare ingresso/uscita dai reparti 
(Clean Room → Autoclavi → NDI). Assicurarsi che siano ben visibili e protetti durante la movimentazione.
          </Typography>
        </Alert>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Totale ODL
              </Typography>
              <Typography variant="h5">
                {odls.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Selezionati
              </Typography>
              <Typography variant="h5" color="primary">
                {selectedOdls.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Con QR
              </Typography>
              <Typography variant="h5" color="success.main">
                {odls.filter(odl => odl.qrCode).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Senza QR
              </Typography>
              <Typography variant="h5" color="warning.main">
                {odls.filter(odl => !odl.qrCode).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedOdls.size === odls.length && odls.length > 0}
                indeterminate={selectedOdls.size > 0 && selectedOdls.size < odls.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                icon={<CheckBoxOutlineBlank />}
                checkedIcon={<CheckBox />}
              />
            }
            label="Seleziona tutti"
          />
          
          <Divider orientation="vertical" flexItem />
          
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrintSelected}
            disabled={selectedOdls.size === 0}
          >
            Stampa Selezionati ({selectedOdls.size})
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintAll}
            disabled={odls.length === 0}
          >
            Stampa Tutti ({odls.length})
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setConfigDialog(true)}
            color="secondary"
          >
            Configurazione
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewDialog(true)}
            disabled={selectedOdls.size === 0}
            color="info"
          >
            Anteprima
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportLabels}
            disabled={selectedOdls.size === 0}
          >
            Esporta HTML
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => handleExportPDF('qr-labels')}
            disabled={selectedOdls.size === 0}
            color="secondary"
          >
            Esporta PDF
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => handleExportPDF('odl-report')}
            disabled={selectedOdls.size === 0}
            color="primary"
          >
            Report PDF
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton onClick={fetchOdls} disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Cerca per ODL o numero parte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
          />
          
          <FilterPanel
            open={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            filters={filters}
            values={filterValues}
            onChange={setFilterValues}
            onApply={() => {
              fetchOdls()
              setFilterPanelOpen(false)
            }}
            onReset={() => {
              setFilterValues({})
              fetchOdls()
            }}
          />

        </Stack>
      </Paper>

      {/* ODL Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable<ODLForQR>
            data={odls}
            columns={columns}
            loading={false}
            totalCount={odls.length}
            page={0}
            rowsPerPage={odls.length}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
        )}
      </Paper>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Configurazione Stampa QR</Typography>
            <IconButton onClick={() => setConfigDialog(false)}>
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Template Selection */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={currentTemplate}
                  label="Template"
                  onChange={(e) => loadTemplate(e.target.value)}
                >
                  <MenuItem value="default">Default</MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} {template.isDefault && '(Default)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Basic Configuration */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Formato Carta</InputLabel>
                <Select
                  value={printConfig.paperFormat}
                  label="Formato Carta"
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, paperFormat: e.target.value as any }))}
                >
                  <MenuItem value="A4">A4 (210 × 297 mm)</MenuItem>
                  <MenuItem value="A5">A5 (148 × 210 mm)</MenuItem>
                  <MenuItem value="CUSTOM">Personalizzato</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Layout Matrice</InputLabel>
                <Select
                  value={printConfig.matrixLayout}
                  label="Layout Matrice"
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, matrixLayout: e.target.value as any }))}
                >
                  <MenuItem value="1x2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 1×2 (2 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="2x2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 2×2 (4 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="2x3">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 2×3 (6 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="3x3">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 3×3 (9 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="3x4">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 3×4 (12 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="4x4">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 4×4 (16 etichette per foglio)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Dimensione QR</InputLabel>
                <Select
                  value={printConfig.qrSize}
                  label="Dimensione QR"
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, qrSize: e.target.value as any }))}
                >
                  <MenuItem value="SMALL">Piccola (30mm) - Uso standard</MenuItem>
                  <MenuItem value="MEDIUM">Media (40mm) - Consigliata</MenuItem>
                  <MenuItem value="LARGE">Grande (50mm) - Scansione a distanza</MenuItem>
                  <MenuItem value="XLARGE">Extra Grande (60mm) - Condizioni difficili</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Advanced QR Settings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Risoluzione DPI</InputLabel>
                <Select
                  value={printConfig.dpi}
                  label="Risoluzione DPI"
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, dpi: Number(e.target.value) as any }))}
                >
                  <MenuItem value={300}>300 DPI - Standard</MenuItem>
                  <MenuItem value={600}>600 DPI - Alta qualità</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Correzione Errori</InputLabel>
                <Select
                  value={printConfig.errorCorrection}
                  label="Correzione Errori"
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, errorCorrection: e.target.value as any }))}
                >
                  <MenuItem value="L">Basso (7%)</MenuItem>
                  <MenuItem value="M">Medio (15%)</MenuItem>
                  <MenuItem value="Q">Quartile (25%)</MenuItem>
                  <MenuItem value="H">Alto (30%) - Consigliato Aerospace</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Margins */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Margini (mm)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Superiore"
                    type="number"
                    value={printConfig.margins.top}
                    onChange={(e) => setPrintConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, top: Number(e.target.value) }
                    }))}
                    inputProps={{ min: 0, max: 50 }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Destro"
                    type="number"
                    value={printConfig.margins.right}
                    onChange={(e) => setPrintConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, right: Number(e.target.value) }
                    }))}
                    inputProps={{ min: 0, max: 50 }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Inferiore"
                    type="number"
                    value={printConfig.margins.bottom}
                    onChange={(e) => setPrintConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, bottom: Number(e.target.value) }
                    }))}
                    inputProps={{ min: 0, max: 50 }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Sinistro"
                    type="number"
                    value={printConfig.margins.left}
                    onChange={(e) => setPrintConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, left: Number(e.target.value) }
                    }))}
                    inputProps={{ min: 0, max: 50 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Content Options */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Contenuto Etichette
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={printConfig.includePartDescription}
                      onChange={(e) => setPrintConfig(prev => ({ ...prev, includePartDescription: e.target.checked }))}
                    />
                  }
                  label="Includi descrizione parte"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={printConfig.includeDepartment}
                      onChange={(e) => setPrintConfig(prev => ({ ...prev, includeDepartment: e.target.checked }))}
                    />
                  }
                  label="Includi reparto corrente"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={printConfig.includeDateTime}
                      onChange={(e) => setPrintConfig(prev => ({ ...prev, includeDateTime: e.target.checked }))}
                    />
                  }
                  label="Includi data/ora stampa"
                />
              </Stack>
            </Grid>

            {/* Best Practices Info */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" icon={false}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Best Practices Stampa QR - Standard Aerospaziale
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  <li>
                    <Typography variant="body2">
                      <strong>Dimensione minima</strong>: 30mm x 30mm per garantire leggibilità in ambiente industriale
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Quiet zone</strong>: spazio bianco di almeno 4 moduli intorno al QR code
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Risoluzione</strong>: 300 DPI minimo, 600 DPI per qualità professionale
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Correzione errori</strong>: livello H (30%) consigliato per ambienti difficili
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Contrasto</strong>: nero su bianco, evitare sfondi colorati o patterns
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Posizionamento</strong>: applicare su superficie piana, protetta da plastificazione o supporto rigido
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Identificazione</strong>: includere sempre ODL e Part Number leggibili sotto il QR
                    </Typography>
                  </li>
                </Box>
              </Alert>
            </Grid>

            {/* Template Management */}
            <Grid size={{ xs: 12 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Gestione Template</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <TextField
                      label="Nome nuovo template"
                      placeholder="es. Etichette Produzione"
                      onKeyDown={(e) => {
                        const input = e.target as HTMLInputElement
                        if (e.key === 'Enter' && input.value.trim()) {
                          saveTemplate(input.value.trim())
                          input.value = ''
                        }
                      }}

                      InputProps={{
                        endAdornment: (
                          <Button
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={(e) => {
                              const input = (e.target as any).closest('.MuiTextField-root').querySelector('input')
                              if (input?.value.trim()) {
                                saveTemplate(input.value.trim())
                                input.value = ''
                              }
                            }}
                          >
                            Salva
                          </Button>
                        )
                      }}
                    />
                    
                    {templates.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Template salvati:
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {templates.map((template) => (
                            <Box key={template.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2">{template.name}</Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => deleteTemplate(template.id)}
                              >
                                Elimina
                              </Button>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>
            Chiudi
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setConfigDialog(false)
              if (selectedOdls.size > 0) {
                setPreviewDialog(true)
              }
            }}
            startIcon={<PreviewIcon />}
          >
            Applica e Anteprima
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Anteprima Stampa - {selectedOdls.size} etichette
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configurazione: {printConfig.paperFormat} - {printConfig.matrixLayout} - QR {printConfig.qrSize}
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${printConfig.matrixLayout.split('x')[0]}, 1fr)`,
              gap: 1,
              p: 2,
              bgcolor: 'white',
              border: '1px solid #ccc',
              aspectRatio: '1',
              maxWidth: '400px'
            }}>
              {Array.from(selectedOdls).slice(0, 4).map((odlId) => {
                const odl = odls.find(o => o.id === odlId)
                if (!odl) return null
                
                return (
                  <Box key={odlId} sx={{ 
                    border: '1px solid #333',
                    p: 1,
                    textAlign: 'center',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    aspectRatio: '1',
                    position: 'relative'
                  }}>
                    <Typography variant="caption" fontWeight="bold">
                      {odl.odlNumber}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PreviewQRCode odl={odl} size={printConfig.qrSize} errorCorrection={printConfig.errorCorrection} />
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight="bold">
                        {odl.part.partNumber}
                      </Typography>
                      {printConfig.includePartDescription && (
                        <Typography variant="caption" display="block" sx={{ fontSize: '8px', color: 'text.secondary' }}>
                          {odl.part.description.slice(0, 30)}...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
            
            {selectedOdls.size > 4 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                ... e altre {selectedOdls.size - 4} etichette
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            Chiudi
          </Button>
          <Button onClick={() => setConfigDialog(true)} startIcon={<SettingsIcon />}>
            Modifica Configurazione
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setPreviewDialog(false)
              handlePrintSelected()
            }}
            startIcon={<Print />}
          >
            Stampa Ora
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}