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
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  Divider,
  Grid
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as CycleIcon,
  ArrowBack,
  Thermostat,
  Compress,
  Timer
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface CuringCycle {
  id: string
  code: string
  name: string
  description?: string
  phase1Temperature: number
  phase1Pressure: number
  phase1Duration: number
  phase2Temperature?: number
  phase2Pressure?: number
  phase2Duration?: number
  isActive: boolean
}

export default function CureProgramsManagementPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<CuringCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCycle, setEditingCycle] = useState<CuringCycle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPhase2, setHasPhase2] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    phase1Temperature: '',
    phase1Pressure: '',
    phase1Duration: '',
    phase2Temperature: '',
    phase2Pressure: '',
    phase2Duration: '',
    isActive: true
  })

  useEffect(() => {
    loadCycles()
  }, [])

  const loadCycles = async () => {
    try {
      const response = await fetch('/api/admin/cure-programs')
      if (response.ok) {
        const data = await response.json()
        setCycles(data)
      } else {
        setError('Errore nel caricamento dei cicli di cura')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (cycle?: CuringCycle) => {
    if (cycle) {
      setEditingCycle(cycle)
      setHasPhase2(!!cycle.phase2Temperature)
      setFormData({
        code: cycle.code,
        name: cycle.name,
        description: cycle.description || '',
        phase1Temperature: cycle.phase1Temperature.toString(),
        phase1Pressure: cycle.phase1Pressure.toString(),
        phase1Duration: cycle.phase1Duration.toString(),
        phase2Temperature: cycle.phase2Temperature?.toString() || '',
        phase2Pressure: cycle.phase2Pressure?.toString() || '',
        phase2Duration: cycle.phase2Duration?.toString() || '',
        isActive: cycle.isActive
      })
    } else {
      setEditingCycle(null)
      setHasPhase2(false)
      setFormData({
        code: '',
        name: '',
        description: '',
        phase1Temperature: '',
        phase1Pressure: '',
        phase1Duration: '',
        phase2Temperature: '',
        phase2Pressure: '',
        phase2Duration: '',
        isActive: true
      })
    }
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        phase1Temperature: parseFloat(formData.phase1Temperature),
        phase1Pressure: parseFloat(formData.phase1Pressure),
        phase1Duration: parseInt(formData.phase1Duration),
        isActive: formData.isActive
      }

      if (hasPhase2 && formData.phase2Temperature) {
        payload.phase2Temperature = parseFloat(formData.phase2Temperature)
        payload.phase2Pressure = parseFloat(formData.phase2Pressure)
        payload.phase2Duration = parseInt(formData.phase2Duration)
      }

      const url = editingCycle 
        ? `/api/admin/cure-programs/${editingCycle.id}`
        : '/api/admin/cure-programs'
      
      const method = editingCycle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setOpenDialog(false)
        loadCycles()
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
    if (!confirm('Sei sicuro di voler eliminare questo ciclo di cura?')) return

    try {
      const response = await fetch(`/api/admin/cure-programs/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadCycles()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const columns: GridColDef<CuringCycle>[] = [
    { 
      field: 'code', 
      headerName: 'Codice', 
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} color="primary" size="small" />
      )
    },
    { field: 'name', headerName: 'Nome', width: 200 },
    { 
      field: 'phase1', 
      headerName: 'Fase 1', 
      width: 200,
      valueGetter: (value, row) => {
        return `${row.phase1Temperature}°C, ${row.phase1Pressure}bar, ${row.phase1Duration}min`
      }
    },
    { 
      field: 'phase2', 
      headerName: 'Fase 2', 
      width: 200,
      valueGetter: (value, row) => {
        if (row.phase2Temperature) {
          return `${row.phase2Temperature}°C, ${row.phase2Pressure}bar, ${row.phase2Duration}min`
        }
        return 'N/A'
      },
      renderCell: (params) => {
        if (params.value === 'N/A') {
          return <Typography variant="body2" color="textSecondary">-</Typography>
        }
        return params.value
      }
    },
    { 
      field: 'totalDuration', 
      headerName: 'Durata Totale', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value, row) => {
        const total = row.phase1Duration + (row.phase2Duration || 0)
        return `${total} min`
      }
    },
    { 
      field: 'isActive', 
      headerName: 'Stato', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Attivo' : 'Inattivo'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
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
            <CycleIcon />
            Gestione Cicli di Cura
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Configurazione dei programmi di cura con temperature, pressioni e durate
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Ciclo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={cycles}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCycle ? 'Modifica Ciclo di Cura' : 'Nuovo Ciclo di Cura'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Info Base */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Codice"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  fullWidth
                  required
                  helperText="Es: CC001"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  helperText="Es: Ciclo Standard 120°C"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Descrizione"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Fase 1 */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Fase 1 (Obbligatoria)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={4}>
                  <TextField
                    label="Temperatura (°C)"
                    type="number"
                    value={formData.phase1Temperature}
                    onChange={(e) => setFormData({ ...formData, phase1Temperature: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <Thermostat color="action" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid size={4}>
                  <TextField
                    label="Pressione (bar)"
                    type="number"
                    value={formData.phase1Pressure}
                    onChange={(e) => setFormData({ ...formData, phase1Pressure: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <Compress color="action" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid size={4}>
                  <TextField
                    label="Durata (min)"
                    type="number"
                    value={formData.phase1Duration}
                    onChange={(e) => setFormData({ ...formData, phase1Duration: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <Timer color="action" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Fase 2 */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasPhase2}
                    onChange={(e) => setHasPhase2(e.target.checked)}
                  />
                }
                label="Aggiungi Fase 2 (Opzionale)"
              />
              {hasPhase2 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={4}>
                    <TextField
                      label="Temperatura (°C)"
                      type="number"
                      value={formData.phase2Temperature}
                      onChange={(e) => setFormData({ ...formData, phase2Temperature: e.target.value })}
                      fullWidth
                      required={hasPhase2}
                      InputProps={{
                        startAdornment: <Thermostat color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      label="Pressione (bar)"
                      type="number"
                      value={formData.phase2Pressure}
                      onChange={(e) => setFormData({ ...formData, phase2Pressure: e.target.value })}
                      fullWidth
                      required={hasPhase2}
                      InputProps={{
                        startAdornment: <Compress color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      label="Durata (min)"
                      type="number"
                      value={formData.phase2Duration}
                      onChange={(e) => setFormData({ ...formData, phase2Duration: e.target.value })}
                      fullWidth
                      required={hasPhase2}
                      InputProps={{
                        startAdornment: <Timer color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Ciclo Attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCycle ? 'Salva Modifiche' : 'Crea'}
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