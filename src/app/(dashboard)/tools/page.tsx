'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Tooltip,
  Grid,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material'
import {
  Build,
  Add,
  Search,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material'

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
  material: string
  isActive: boolean
  associatedParts: number
  createdAt: string
  updatedAt: string
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [filteredTools, setFilteredTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState({
    toolPartNumber: '',
    description: '',
    base: '',
    height: '',
    weight: '',
    material: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTools()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, tools])

  const loadTools = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tools')
      if (response.ok) {
        const data = await response.json()
        setTools(data)
      } else {
        // Dati mock per sviluppo
        setTools([
          {
            id: '1',
            toolPartNumber: 'STR-001',
            description: 'Stampo pannello laterale',
            base: 1200,
            height: 800,
            weight: 25.5,
            material: 'Acciaio inox 316L',
            isActive: true,
            associatedParts: 3,
            createdAt: '2024-06-15T10:00:00Z',
            updatedAt: '2024-06-15T10:00:00Z'
          },
          {
            id: '2',
            toolPartNumber: 'UTL-002',
            description: 'Utensile taglio carbonio',
            base: 300,
            height: 200,
            weight: 12.8,
            material: 'Fibra di carbonio',
            isActive: true,
            associatedParts: 8,
            createdAt: '2024-06-20T14:30:00Z',
            updatedAt: '2024-06-20T14:30:00Z'
          },
          {
            id: '3',
            toolPartNumber: 'STR-003',
            description: 'Forma longherone principale',
            base: 2000,
            height: 400,
            material: 'Alluminio 7075',
            isActive: false,
            associatedParts: 1,
            createdAt: '2024-05-10T09:15:00Z',
            updatedAt: '2024-05-10T09:15:00Z'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tools]

    if (searchTerm) {
      filtered = filtered.filter(tool =>
        tool.toolPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tool.material.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTools(filtered)
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error'
  }

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Attivo' : 'Non Attivo'
  }

  const formatDimensions = (base: number, height: number) => {
    return `${base} × ${height} mm`
  }

  const formatWeight = (weight?: number) => {
    return weight ? `${weight} kg` : '-'
  }

  const resetForm = () => {
    setFormData({
      toolPartNumber: '',
      description: '',
      base: '',
      height: '',
      weight: '',
      material: '',
      isActive: true
    })
    setFormErrors({})
    setSelectedTool(null)
  }

  const handleCreateTool = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool)
    setFormData({
      toolPartNumber: tool.toolPartNumber,
      description: tool.description || '',
      base: tool.base.toString(),
      height: tool.height.toString(),
      weight: tool.weight?.toString() || '',
      material: tool.material,
      isActive: tool.isActive
    })
    setEditDialogOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.toolPartNumber.trim()) {
      errors.toolPartNumber = 'Part Number richiesto'
    }

    if (!formData.base || parseFloat(formData.base) <= 0) {
      errors.base = 'Base deve essere un numero positivo'
    }

    if (!formData.height || parseFloat(formData.height) <= 0) {
      errors.height = 'Altezza deve essere un numero positivo'
    }

    if (formData.weight && parseFloat(formData.weight) <= 0) {
      errors.weight = 'Peso deve essere un numero positivo'
    }

    if (!formData.material.trim()) {
      errors.material = 'Materiale richiesto'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        toolPartNumber: formData.toolPartNumber.trim(),
        description: formData.description.trim() || undefined,
        base: parseFloat(formData.base),
        height: parseFloat(formData.height),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        material: formData.material.trim(),
        isActive: formData.isActive
      }

      const url = selectedTool ? `/api/tools/${selectedTool.id}` : '/api/tools'
      const method = selectedTool ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadTools()
        setCreateDialogOpen(false)
        setEditDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        setFormErrors({ general: error.error || 'Errore nel salvataggio' })
      }
    } catch (error) {
      setFormErrors({ general: 'Errore di connessione' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTool = async (tool: Tool) => {
    if (!confirm(`Sei sicuro di voler eliminare lo strumento ${tool.toolPartNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tools/${tool.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTools()
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    }
  }

  if (loading) {
    return (
      <Box className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Build />
          Gestione Strumenti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTool}
        >
          Nuovo Strumento
        </Button>
      </Box>

      {/* Search */}
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Cerca per codice, nome o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card>
        <CardContent>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6">
              Strumenti ({filteredTools.length})
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell>Dimensioni (mm)</TableCell>
                  <TableCell>Peso</TableCell>
                  <TableCell>Materiale</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Parti Associate</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {tool.toolPartNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tool.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDimensions(tool.base, tool.height)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatWeight(tool.weight)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tool.material}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(tool.isActive)}
                        color={getStatusColor(tool.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {tool.associatedParts}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex gap-1">
                        <Tooltip title="Visualizza dettagli">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton size="small" onClick={() => handleEditTool(tool)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTool(tool)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTools.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">
                        Nessuno strumento trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nuovo Strumento</DialogTitle>
        <DialogContent>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Part Number"
                value={formData.toolPartNumber}
                onChange={(e) => setFormData({ ...formData, toolPartNumber: e.target.value })}
                error={!!formErrors.toolPartNumber}
                helperText={formErrors.toolPartNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descrizione"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Base (mm)"
                type="number"
                value={formData.base}
                onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                error={!!formErrors.base}
                helperText={formErrors.base}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Altezza (mm)"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                error={!!formErrors.height}
                helperText={formErrors.height}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Peso (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                error={!!formErrors.weight}
                helperText={formErrors.weight}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Materiale"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                error={!!formErrors.material}
                helperText={formErrors.material}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Strumento attivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
            Annulla
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modifica Strumento</DialogTitle>
        <DialogContent>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Part Number"
                value={formData.toolPartNumber}
                onChange={(e) => setFormData({ ...formData, toolPartNumber: e.target.value })}
                error={!!formErrors.toolPartNumber}
                helperText={formErrors.toolPartNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descrizione"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Base (mm)"
                type="number"
                value={formData.base}
                onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                error={!!formErrors.base}
                helperText={formErrors.base}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Altezza (mm)"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                error={!!formErrors.height}
                helperText={formErrors.height}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Peso (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                error={!!formErrors.weight}
                helperText={formErrors.weight}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Materiale"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                error={!!formErrors.material}
                helperText={formErrors.material}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Strumento attivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
            Annulla
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}