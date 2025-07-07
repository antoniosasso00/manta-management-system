'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  IconButton,
  Alert,
  Chip,
  Grid,
  Paper,
  InputAdornment
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as ConfigIcon,
  ArrowBack,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Timer
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Part {
  id: string
  partNumber: string
  description: string
}

interface CuringCycle {
  id: string
  code: string
  name: string
}

interface PartAutoclave {
  id: string
  partId: string
  part: Part
  curingCycleId: string
  curingCycle: CuringCycle
  vacuumLines: number
  setupTime?: number
  loadPosition?: string
  notes?: string
}

export default function PartConfigPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<PartAutoclave[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [cycles, setCycles] = useState<CuringCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PartAutoclave | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    partId: '',
    curingCycleId: '',
    vacuumLines: '',
    setupTime: '',
    loadPosition: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [configsRes, partsRes, cyclesRes] = await Promise.all([
        fetch('/api/admin/part-autoclave'),
        fetch('/api/admin/parts'),
        fetch('/api/admin/cure-programs')
      ])

      if (configsRes.ok && partsRes.ok && cyclesRes.ok) {
        const [configsData, partsData, cyclesData] = await Promise.all([
          configsRes.json(),
          partsRes.json(),
          cyclesRes.json()
        ])
        
        setConfigs(configsData)
        setParts(partsData)
        setCycles(cyclesData)
      } else {
        setError('Errore nel caricamento dei dati')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (config?: PartAutoclave) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        partId: config.partId,
        curingCycleId: config.curingCycleId,
        vacuumLines: config.vacuumLines.toString(),
        setupTime: config.setupTime?.toString() || '',
        loadPosition: config.loadPosition || '',
        notes: config.notes || ''
      })
    } else {
      setEditingConfig(null)
      setFormData({
        partId: '',
        curingCycleId: '',
        vacuumLines: '',
        setupTime: '',
        loadPosition: '',
        notes: ''
      })
    }
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        partId: formData.partId,
        curingCycleId: formData.curingCycleId,
        vacuumLines: parseInt(formData.vacuumLines),
        setupTime: formData.setupTime ? parseInt(formData.setupTime) : null,
        loadPosition: formData.loadPosition || null,
        notes: formData.notes || null
      }

      const url = '/api/admin/part-autoclave'
      const method = 'POST' // Upsert

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setOpenDialog(false)
        loadData()
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nel salvataggio')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa configurazione?')) return

    try {
      const response = await fetch(`/api/admin/part-autoclave/${id}`, {
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
    try {
      const response = await fetch('/api/admin/part-autoclave/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `part_autoclave_config_${new Date().toISOString().split('T')[0]}.csv`
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
    // Crea input file nascosto per upload CSV
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      // Parsing CSV semplificato - in produzione usare una libreria come Papa Parse
      const text = await file.text()
      const lines = text.split('\n').slice(1) // Skip header
      
      const configs = lines
        .filter(line => line.trim())
        .map((line, index) => {
          const [partNumber, curingCycleName, vacuumLines, setupTime, loadPosition, notes] = 
            line.split(',').map(field => field.replace(/"/g, '').trim())
          
          try {
            return {
              partNumber,
              curingCycleName,
              vacuumLines: parseInt(vacuumLines) || 0,
              setupTime: setupTime ? parseInt(setupTime) : undefined,
              loadPosition: loadPosition || undefined,
              notes: notes || undefined
            }
          } catch (error) {
            console.error(`Error parsing line ${index + 2}:`, line)
            return null
          }
        })
        .filter(Boolean)
      
      try {
        const response = await fetch('/api/admin/part-autoclave/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configs, skipDuplicates: true })
        })
        
        const result = await response.json()
        alert(result.message)
        loadData() // Refresh data
      } catch (error) {
        console.error('Import error:', error)
        alert('Errore durante l\'import delle configurazioni')
      }
    }
    input.click()
  }

  // Filtra configurazioni in base alla ricerca
  const filteredConfigs = configs.filter(config => 
    config.part.partNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    config.part.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    config.curingCycle.code.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const columns: GridColDef<PartAutoclave>[] = [
    { 
      field: 'partNumber', 
      headerName: 'Part Number', 
      width: 150,
      valueGetter: (value, row) => row.part.partNumber,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      )
    },
    { 
      field: 'description', 
      headerName: 'Descrizione', 
      width: 250,
      valueGetter: (value, row) => row.part.description
    },
    { 
      field: 'curingCycle', 
      headerName: 'Ciclo di Cura', 
      width: 180,
      valueGetter: (value, row) => row.curingCycle.code + ' - ' + row.curingCycle.name,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.curingCycle.code}</Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.curingCycle.name}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'vacuumLines', 
      headerName: 'Valvole', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color="primary"
        />
      )
    },
    { 
      field: 'setupTime', 
      headerName: 'Setup (min)', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value || '-'
    },
    { 
      field: 'loadPosition', 
      headerName: 'Posizione', 
      width: 120,
      renderCell: (params) => params.value || '-'
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="h4" className="flex items-center gap-2">
            <ConfigIcon />
            Configurazione Part-Autoclave
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Associa part number a cicli di cura e parametri specifici per autoclavi
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImport}
          >
            Importa CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Esporta CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuova Config
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {configs.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Configurazioni Totali
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="secondary">
              {cycles.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Cicli Disponibili
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {configs.reduce((acc, c) => acc + c.vacuumLines, 0) / (configs.length || 1)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Media Valvole
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {configs.filter(c => c.setupTime).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Con Tempo Setup
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        placeholder="Cerca per part number, descrizione o ciclo..."
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
            rows={filteredConfigs}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Modifica Configurazione' : 'Nuova Configurazione Part-Autoclave'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Autocomplete
              options={parts}
              getOptionLabel={(option) => `${option.partNumber} - ${option.description}`}
              value={parts.find(p => p.id === formData.partId) || null}
              onChange={(_, newValue) => setFormData({ ...formData, partId: newValue?.id || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Part Number" required />
              )}
              disabled={!!editingConfig}
            />
            
            <Autocomplete
              options={cycles}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={cycles.find(c => c.id === formData.curingCycleId) || null}
              onChange={(_, newValue) => setFormData({ ...formData, curingCycleId: newValue?.id || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Ciclo di Cura" required />
              )}
            />

            <TextField
              label="Numero Valvole"
              type="number"
              value={formData.vacuumLines}
              onChange={(e) => setFormData({ ...formData, vacuumLines: e.target.value })}
              required
              inputProps={{ min: 0 }}
              helperText="Numero di valvole richieste per questo part"
            />

            <TextField
              label="Tempo Setup"
              type="number"
              value={formData.setupTime}
              onChange={(e) => setFormData({ ...formData, setupTime: e.target.value })}
              InputProps={{
                startAdornment: <Timer color="action" sx={{ mr: 1 }} />,
                endAdornment: <InputAdornment position="end">minuti</InputAdornment>
              }}
              helperText="Tempo di preparazione (opzionale)"
            />

            <TextField
              label="Posizione Preferita"
              value={formData.loadPosition}
              onChange={(e) => setFormData({ ...formData, loadPosition: e.target.value })}
              helperText="Es: Fondo, Centro, Sopra (opzionale)"
            />

            <TextField
              label="Note"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              helperText="Note specifiche per questo part (opzionale)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.partId || !formData.curingCycleId || !formData.vacuumLines}
          >
            {editingConfig ? 'Salva Modifiche' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/admin/departments/autoclavi')}
        >
          Torna a Gestione Autoclavi
        </Button>
      </Box>
    </Box>
  )
}