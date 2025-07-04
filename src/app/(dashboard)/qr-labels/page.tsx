'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { FilterPanel, FilterConfig, FilterValues } from '@/components/molecules'
import type { Column } from '@/components/atoms/DataTable'
import { useAuth } from '@/hooks/useAuth'

interface ODLForQR {
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
  matrixLayout: '2x2' | '3x3' | '4x4' | '2x1' | '1x4'
  qrSize: 'SMALL' | 'MEDIUM' | 'LARGE'
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
  
  // Print Configuration State
  const [configDialog, setConfigDialog] = useState(false)
  const [printConfig, setPrintConfig] = useState<PrintConfiguration>({
    paperFormat: 'A4',
    matrixLayout: '2x2',
    qrSize: 'MEDIUM',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    includePartDescription: true,
    includeDepartment: true,
    includeDateTime: true
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
            timestamp: new Date().toISOString()
          }
          
          try {
            const QRCode = (await import('qrcode')).default
            const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
              width: 256,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' }
            })
            return { ...odl, qrCode: qrCodeDataUrl }
          } catch (error) {
            console.error('Error generating QR code:', error)
            return odl
          }
        }
        return odl
      })
    )

    const getMatrixDimensions = (layout: string) => {
      switch (layout) {
        case '2x2': return { cols: 2, rows: 2 }
        case '3x3': return { cols: 3, rows: 3 }
        case '4x4': return { cols: 4, rows: 4 }
        case '2x1': return { cols: 2, rows: 1 }
        case '1x4': return { cols: 1, rows: 4 }
        default: return { cols: 2, rows: 2 }
      }
    }

    const { cols } = getMatrixDimensions(printConfig.matrixLayout)
    const qrSizes = { SMALL: '25mm', MEDIUM: '35mm', LARGE: '45mm' }
    const labelSizes = { SMALL: '50mm', MEDIUM: '60mm', LARGE: '70mm' }

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
            `<img src="${odl.qrCode}" alt="QR ${odl.odlNumber}" class="qr-image" />` : 
            '<div class="no-qr">QR non disponibile</div>'
          }
        </div>
        <div class="part-info">
          <div class="part-number">${odl.part.partNumber}</div>
          ${printConfig.includePartDescription ? 
            `<div class="part-description">${odl.part.description}</div>` : ''
          }
          ${printConfig.includeDepartment && odl.currentDepartment ? 
            `<div class="department">Rep: ${odl.currentDepartment.name}</div>` : ''
          }
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
              gap: 5mm;
              page-break-inside: avoid;
            }
            .qr-label {
              border: 1px solid #333;
              padding: 3mm;
              text-align: center;
              background: white;
              page-break-inside: avoid;
              min-height: ${labelSizes[printConfig.qrSize]};
              width: ${labelSizes[printConfig.qrSize]};
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
              margin: 2mm 0;
            }
            .qr-image {
              width: ${qrSizes[printConfig.qrSize]} !important;
              height: ${qrSizes[printConfig.qrSize]} !important;
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
              margin-bottom: 1mm;
            }
            .datetime {
              font-size: 7px;
              color: #aaa;
            }
            @media print {
              body { margin: ${printConfig.margins.top}mm ${printConfig.margins.right}mm ${printConfig.margins.bottom}mm ${printConfig.margins.left}mm; }
              .qr-labels-grid { gap: 3mm; }
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
      id: 'select',
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
          Stampa QR Labels
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleziona gli ODL per stampare le etichette QR
        </Typography>
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
            filters={filters}
            values={filterValues}
            onChange={setFilterValues}
            onApply={fetchOdls}
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
          <DataTable
            data={odls}
            columns={columns}
            loading={false}
            stickyHeader
            maxHeight={600}
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
                  <MenuItem value="2x2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 2×2 (4 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="3x3">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 3×3 (9 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="4x4">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GridIcon /> 4×4 (16 etichette per foglio)
                    </Box>
                  </MenuItem>
                  <MenuItem value="2x1">2×1 (2 etichette per riga)</MenuItem>
                  <MenuItem value="1x4">1×4 (4 etichette in colonna)</MenuItem>
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
                  <MenuItem value="SMALL">Piccola (25mm)</MenuItem>
                  <MenuItem value="MEDIUM">Media (35mm)</MenuItem>
                  <MenuItem value="LARGE">Grande (45mm)</MenuItem>
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
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          saveTemplate(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
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
              border: '1px solid #ccc'
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
                    fontSize: '10px'
                  }}>
                    <Typography variant="caption" fontWeight="bold">
                      {odl.odlNumber}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QrCode2 sx={{ fontSize: printConfig.qrSize === 'LARGE' ? 40 : printConfig.qrSize === 'MEDIUM' ? 30 : 20 }} />
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