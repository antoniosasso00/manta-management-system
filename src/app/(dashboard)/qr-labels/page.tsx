'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid2 as Grid,
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
  Tooltip
} from '@mui/material'
import {
  Print,
  Download,
  Refresh,
  CheckBox,
  CheckBoxOutlineBlank,
  QrCode2,
  PictureAsPdf
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

  const printQRLabels = (odlsToPrint: ODLForQR[]) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const qrLabelsHtml = odlsToPrint.map(odl => `
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

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Labels - ${odlsToPrint.length} ODL</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              background: white;
              padding: 10mm;
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
  }

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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
    </Box>
  )
}