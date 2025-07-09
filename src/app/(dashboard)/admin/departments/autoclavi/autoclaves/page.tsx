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
  Alert
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as AutoclaveIcon,
  ArrowBack
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Autoclave {
  id: string
  code: string
  name: string
  maxLength: number
  maxWidth: number
  vacuumLines: number
  isActive: boolean
  department?: {
    id: string
    name: string
  }
}

export default function AutoclavesManagementPage() {
  const router = useRouter()
  const [autoclaves, setAutoclaves] = useState<Autoclave[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAutoclave, setEditingAutoclave] = useState<Autoclave | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    maxLength: '',
    maxWidth: '',
    vacuumLines: '',
    isActive: true
  })

  useEffect(() => {
    loadAutoclaves()
  }, [])

  const loadAutoclaves = async () => {
    try {
      const response = await fetch('/api/admin/autoclaves')
      if (response.ok) {
        const data = await response.json()
        setAutoclaves(data)
      } else {
        setError('Errore nel caricamento degli autoclavi')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (autoclave?: Autoclave) => {
    if (autoclave) {
      setEditingAutoclave(autoclave)
      setFormData({
        code: autoclave.code,
        name: autoclave.name,
        maxLength: autoclave.maxLength.toString(),
        maxWidth: autoclave.maxWidth.toString(),
        vacuumLines: autoclave.vacuumLines.toString(),
        isActive: autoclave.isActive
      })
    } else {
      setEditingAutoclave(null)
      setFormData({
        code: '',
        name: '',
        maxLength: '',
        maxWidth: '',
        vacuumLines: '',
        isActive: true
      })
    }
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        maxLength: parseFloat(formData.maxLength),
        maxWidth: parseFloat(formData.maxWidth),
        vacuumLines: parseInt(formData.vacuumLines),
        isActive: formData.isActive
      }

      const url = editingAutoclave 
        ? `/api/admin/autoclaves/${editingAutoclave.id}`
        : '/api/admin/autoclaves'
      
      const method = editingAutoclave ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setOpenDialog(false)
        loadAutoclaves()
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
    if (!confirm('Sei sicuro di voler eliminare questo autoclave?')) return

    try {
      const response = await fetch(`/api/admin/autoclaves/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAutoclaves()
      } else {
        setError('Errore nell\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const columns: GridColDef<Autoclave>[] = [
    { 
      field: 'code', 
      headerName: 'Codice', 
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color="primary" size="small" />
      )
    },
    { field: 'name', headerName: 'Nome', width: 200 },
    { 
      field: 'dimensions', 
      headerName: 'Dimensioni (L×W)', 
      width: 200,
      valueGetter: (value, row) => 
        `${row.maxLength}×${row.maxWidth} m`
    },
    { 
      field: 'vacuumLines', 
      headerName: 'Linee Vuoto', 
      width: 120,
      align: 'center',
      headerAlign: 'center'
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
            <AutoclaveIcon />
            Gestione Autoclavi
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Configurazione degli autoclavi fisici disponibili nel reparto
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Autoclave
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
            rows={autoclaves}
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
          {editingAutoclave ? 'Modifica Autoclave' : 'Nuovo Autoclave'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Codice"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
              helperText="Es: AUT001"
            />
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="Es: Autoclave 1 - Grande"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <TextField
                label="Lunghezza (m)"
                type="number"
                value={formData.maxLength}
                onChange={(e) => setFormData({ ...formData, maxLength: e.target.value })}
                required
                inputProps={{ step: 0.1, min: 0 }}
              />
              <TextField
                label="Larghezza (m)"
                type="number"
                value={formData.maxWidth}
                onChange={(e) => setFormData({ ...formData, maxWidth: e.target.value })}
                required
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Box>
            <TextField
              label="Numero Linee Vuoto"
              type="number"
              value={formData.vacuumLines}
              onChange={(e) => setFormData({ ...formData, vacuumLines: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0 }}
              helperText="Numero di connessioni vuoto disponibili"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Autoclave Attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingAutoclave ? 'Salva Modifiche' : 'Crea'}
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