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
  Grid,
  Paper
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as ToolIcon,
  ArrowBack,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Link as LinkIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
  material?: string
  valveCount: number
  isActive: boolean
  _count?: {
    partTools: number
  }
}

interface Part {
  id: string
  partNumber: string
  description: string
}

export default function ToolsManagementPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAssociationDialog, setOpenAssociationDialog] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  
  // Form state
  const [formData, setFormData] = useState({
    toolPartNumber: '',
    description: '',
    base: '',
    height: '',
    weight: '',
    material: '',
    valveCount: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [toolsRes, partsRes] = await Promise.all([
        fetch('/api/admin/tools'),
        fetch('/api/admin/parts')
      ])

      if (toolsRes.ok && partsRes.ok) {
        const [toolsData, partsData] = await Promise.all([
          toolsRes.json(),
          partsRes.json()
        ])
        
        setTools(toolsData)
        setParts(partsData)
      } else {
        setError('Errore nel caricamento dei dati')
      }
    } catch (error) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool)
      setFormData({
        toolPartNumber: tool.toolPartNumber,
        description: tool.description || '',
        base: tool.base.toString(),
        height: tool.height.toString(),
        weight: tool.weight?.toString() || '',
        material: tool.material || '',
        valveCount: tool.valveCount.toString(),
        isActive: tool.isActive
      })
    } else {
      setEditingTool(null)
      setFormData({
        toolPartNumber: '',
        description: '',
        base: '',
        height: '',
        weight: '',
        material: '',
        valveCount: '',
        isActive: true
      })
    }
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        toolPartNumber: formData.toolPartNumber,
        description: formData.description || null,
        base: parseFloat(formData.base),
        height: parseFloat(formData.height),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        material: formData.material || null,
        valveCount: parseInt(formData.valveCount) || 0,
        isActive: formData.isActive
      }

      const url = editingTool 
        ? `/api/admin/tools/${editingTool.id}`
        : '/api/admin/tools'
      
      const method = editingTool ? 'PUT' : 'POST'

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
    if (!confirm('Sei sicuro di voler eliminare questo tooling?')) return

    try {
      const response = await fetch(`/api/admin/tools/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadData()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione')
    }
  }

  const handleOpenAssociations = (tool: Tool) => {
    setSelectedTool(tool)
    setOpenAssociationDialog(true)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/tools/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tools_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Errore durante l\'export dei tools')
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
      
      const tools = lines
        .filter(line => line.trim())
        .map((line, index) => {
          const [toolPartNumber, description, base, height, weight, material, valveCount, isActive] = 
            line.split(',').map(field => field.replace(/"/g, '').trim())
          
          try {
            return {
              toolPartNumber,
              description: description || undefined,
              base: parseFloat(base),
              height: parseFloat(height),
              weight: weight ? parseFloat(weight) : undefined,
              material: material || undefined,
              valveCount: parseInt(valveCount) || 0,
              isActive: isActive !== 'Disattivato'
            }
          } catch (error) {
            console.error(`Error parsing line ${index + 2}:`, line)
            return null
          }
        })
        .filter(Boolean)
      
      try {
        const response = await fetch('/api/admin/tools/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools, skipDuplicates: true })
        })
        
        const result = await response.json()
        alert(result.message)
        loadData() // Refresh data
      } catch (error) {
        console.error('Import error:', error)
        alert('Errore durante l\'import dei tools')
      }
    }
    input.click()
  }

  // Filtra tools in base alla ricerca
  const filteredTools = tools.filter(tool => 
    tool.toolPartNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    tool.material?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const columns: GridColDef<Tool>[] = [
    { 
      field: 'toolPartNumber', 
      headerName: 'Part Number Tool', 
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      )
    },
    { 
      field: 'description', 
      headerName: 'Descrizione', 
      width: 250,
      renderCell: (params) => params.value || '-'
    },
    { 
      field: 'dimensions', 
      headerName: 'Dimensioni (B×H)', 
      width: 150,
      valueGetter: (value, row) => 
        `${row.base}×${row.height} m`
    },
    { 
      field: 'weight', 
      headerName: 'Peso (kg)', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value || '-'
    },
    { 
      field: 'material', 
      headerName: 'Materiale', 
      width: 120,
      renderCell: (params) => params.value || '-'
    },
    { 
      field: 'valveCount', 
      headerName: 'Valvole', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value > 0 ? 'primary' : 'default'}
        />
      )
    },
    { 
      field: '_count', 
      headerName: 'Parts Associati', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value, row) => row._count?.partTools || 0,
      renderCell: (params) => {
        const count = params.row._count?.partTools || 0
        return (
          <Box>
            <Chip 
              label={count} 
              size="small" 
              color={count > 0 ? 'secondary' : 'default'}
            />
            <IconButton
              size="small"
              onClick={() => handleOpenAssociations(params.row)}
              color="primary"
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Box>
        )
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
            disabled={(params.row._count?.partTools || 0) > 0}
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
            <ToolIcon />
            Gestione Tool/Tooling
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Gestione centralizzata degli stampi utilizzati in produzione
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
            Nuovo Tool
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
              {tools.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Tool Totali
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {tools.filter(t => t.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Tool Attivi
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="secondary">
              {tools.reduce((acc, t) => acc + (t._count?.partTools || 0), 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Associazioni Part
            </Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {tools.filter(t => t.valveCount > 0).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Con Valvole
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        placeholder="Cerca per part number, descrizione o materiale..."
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
            rows={filteredTools}
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
          {editingTool ? 'Modifica Tool' : 'Nuovo Tool'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Part Number Tool"
              value={formData.toolPartNumber}
              onChange={(e) => setFormData({ ...formData, toolPartNumber: e.target.value })}
              fullWidth
              required
              helperText="Es: TOOL-001"
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Base (m)"
                  type="number"
                  value={formData.base}
                  onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Altezza (m)"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Peso (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  fullWidth
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Numero Valvole"
                  type="number"
                  value={formData.valveCount}
                  onChange={(e) => setFormData({ ...formData, valveCount: e.target.value })}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Materiale"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              fullWidth
              helperText="Es: Acciaio, Alluminio, Composito"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Tool Attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.toolPartNumber || !formData.base || !formData.height}
          >
            {editingTool ? 'Salva Modifiche' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Association Dialog */}
      <Dialog 
        open={openAssociationDialog} 
        onClose={() => setOpenAssociationDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Associazioni Part per {selectedTool?.toolPartNumber}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Gestione delle associazioni Part-Tool sarà implementata nella sezione dedicata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssociationDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/admin')}
        >
          Torna a Pannello Admin
        </Button>
      </Box>
    </Box>
  )
}