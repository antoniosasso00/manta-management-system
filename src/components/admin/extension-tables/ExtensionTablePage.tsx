'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Paper,
  Grid,
  IconButton,
  Chip
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ArrowBack
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { ExtensionTableConfig, ExtensionTableData, CommonSelectOptions } from './types'
import { ExtensionTableDialog } from './ExtensionTableDialog'
import { generateColumns } from './utils/columnGenerator'
import { calculateStats } from './utils/statsCalculator'

interface ExtensionTablePageProps {
  config: ExtensionTableConfig
  backUrl?: string
  mockData?: boolean
}

export default function ExtensionTablePage({ 
  config, 
  backUrl = '/dashboard/admin/departments',
  mockData = false 
}: ExtensionTablePageProps) {
  const router = useRouter()
  const [data, setData] = useState<ExtensionTableData[]>([])
  const [commonOptions, setCommonOptions] = useState<CommonSelectOptions>({ parts: [] })
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ExtensionTableData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  // Carica i dati iniziali
  useEffect(() => {
    loadData()
  }, [config.apiEndpoint])

  const loadData = useCallback(async () => {
    if (mockData) {
      // Dati mock per testing
      setData([])
      setCommonOptions({ parts: [] })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [dataRes, partsRes, cyclesRes] = await Promise.all([
        fetch(config.apiEndpoint),
        fetch('/api/admin/parts'),
        config.apiEndpoint.includes('autoclave') ? fetch('/api/admin/cure-programs') : Promise.resolve(null)
      ])

      if (dataRes.ok && partsRes.ok) {
        const [dataResult, partsResult, cyclesResult] = await Promise.all([
          dataRes.json(),
          partsRes.json(),
          cyclesRes?.json() || null
        ])
        
        setData(dataResult)
        setCommonOptions({
          parts: partsResult,
          curingCycles: cyclesResult
        })
      } else {
        setError('Errore nel caricamento dei dati')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }, [config.apiEndpoint, mockData])

  const handleOpenDialog = (item?: ExtensionTableData) => {
    setEditingItem(item || null)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingItem(null)
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    if (mockData) {
      // Simula il salvataggio per i mockup
      setOpenDialog(false)
      setError(null)
      return
    }

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem 
        ? `${config.apiEndpoint}/${editingItem.id}`
        : config.apiEndpoint

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setOpenDialog(false)
        loadData()
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Errore nel salvataggio')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const handleDelete = async (id: string) => {
    if (mockData) {
      // Simula l'eliminazione per i mockup
      return
    }

    if (!confirm('Sei sicuro di voler eliminare questa configurazione?')) return

    try {
      const response = await fetch(`${config.apiEndpoint}/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadData()
      } else {
        setError('Errore nell\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const handleExport = async () => {
    if (mockData) {
      alert('Funzione di export non disponibile per i mockup')
      return
    }

    try {
      const response = await fetch(`${config.apiEndpoint}/export`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.entityName}_config_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Errore durante l\'export delle configurazioni')
    }
  }

  const handleImport = () => {
    if (mockData) {
      alert('Funzione di import non disponibile per i mockup')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      // Implementazione import semplificata
      alert('Funzione di import da implementare')
    }
    input.click()
  }

  // Filtra i dati in base alla ricerca
  const filteredData = data.filter(item => {
    const searchTerm = searchFilter.toLowerCase()
    return (
      item.part?.partNumber?.toLowerCase().includes(searchTerm) ||
      item.part?.description?.toLowerCase().includes(searchTerm) ||
      Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchTerm)
      )
    )
  })

  // Genera le colonne dinamicamente
  const columns: GridColDef[] = [
    ...generateColumns(config.fields),
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {config.actions?.canEdit !== false && (
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {config.actions?.canDelete !== false && (
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  // Calcola le statistiche
  const stats = calculateStats(config.stats || [], data)

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="h4" className="flex items-center gap-2">
            {config.displayName}
            {mockData && <Chip label="MOCKUP" color="warning" size="small" />}
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            {config.description}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          {config.actions?.canImport !== false && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImport}
              disabled={mockData}
            >
              Importa CSV
            </Button>
          )}
          {config.actions?.canExport !== false && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={mockData}
            >
              Esporta CSV
            </Button>
          )}
          {config.actions?.canCreate !== false && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nuova Config
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {mockData && (
        <Alert severity="info">
          Questa è una pagina di esempio. Le funzionalità di gestione dati saranno implementate quando il backend sarà disponibile.
        </Alert>
      )}

      {/* Stats Cards */}
      {stats.length > 0 && (
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid size={3} key={index}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={`${stat.color || 'primary'}.main`}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Search */}
      <TextField
        placeholder="Cerca per part number, descrizione o altri campi..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
      />

      {/* Data Grid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={filteredData}
            columns={columns}
            loading={loading}
            autoHeight
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ExtensionTableDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        config={config}
        editingItem={editingItem}
        commonOptions={commonOptions}
        mockData={mockData}
      />

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => router.push(backUrl)}
        >
          Torna Indietro
        </Button>
      </Box>
    </Box>
  )
}