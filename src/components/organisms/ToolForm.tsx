'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Autocomplete,
  Chip,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material'
import { Add, Remove, Search } from '@mui/icons-material'
import { CreateToolWithPartsInput, UpdateToolWithPartsInput } from '@/domains/core/schemas/tool.schema'

interface Part {
  id: string
  partNumber: string
  description?: string
  isActive: boolean
}

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
  material?: string
  isActive: boolean
  associatedParts?: Part[]
}

interface ToolFormProps {
  open: boolean
  onClose: () => void
  tool?: Tool | null
  onSubmit: (data: CreateToolWithPartsInput | UpdateToolWithPartsInput) => Promise<void>
}

export default function ToolForm({ open, onClose, tool, onSubmit }: ToolFormProps) {
  const [formData, setFormData] = useState({
    toolPartNumber: '',
    description: '',
    base: '',
    height: '',
    weight: '',
    material: '',
    isActive: true,
    associatedPartIds: [] as string[]
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [parts, setParts] = useState<Part[]>([])
  const [selectedParts, setSelectedParts] = useState<Part[]>([])
  const [partsLoading, setPartsLoading] = useState(false)
  const [partSearchTerm, setPartSearchTerm] = useState('')

  // Load parts for autocomplete
  useEffect(() => {
    if (open) {
      loadParts()
    }
  }, [open])

  // Initialize form when tool changes
  useEffect(() => {
    if (tool) {
      setFormData({
        toolPartNumber: tool.toolPartNumber,
        description: tool.description || '',
        base: tool.base.toString(),
        height: tool.height.toString(),
        weight: tool.weight?.toString() || '',
        material: tool.material || '',
        isActive: tool.isActive,
        associatedPartIds: tool.associatedParts?.map(p => p.id) || []
      })
      setSelectedParts(tool.associatedParts || [])
    } else {
      resetForm()
    }
  }, [tool])

  const loadParts = async () => {
    setPartsLoading(true)
    try {
      const response = await fetch('/api/parts?limit=100&isActive=true')
      if (response.ok) {
        const data = await response.json()
        setParts(data)
      }
    } catch (error) {
      console.error('Error loading parts:', error)
    } finally {
      setPartsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      toolPartNumber: '',
      description: '',
      base: '',
      height: '',
      weight: '',
      material: '',
        isActive: true,
      associatedPartIds: []
    })
    setSelectedParts([])
    setFormErrors({})
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
        material: formData.material.trim() || undefined,
        isActive: formData.isActive,
        associatedPartIds: selectedParts.map(p => p.id)
      }

      if (tool) {
        await onSubmit({ ...payload, id: tool.id })
      } else {
        await onSubmit(payload)
      }

      onClose()
      resetForm()
    } catch (error) {
      setFormErrors({ general: 'Errore nel salvataggio' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePartSelect = (part: Part) => {
    if (!selectedParts.find(p => p.id === part.id)) {
      setSelectedParts([...selectedParts, part])
    }
  }

  const handlePartRemove = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.id !== partId))
  }

  const filteredParts = parts.filter(part => 
    !selectedParts.find(selected => selected.id === part.id) &&
    (part.partNumber.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
     part.description?.toLowerCase().includes(partSearchTerm.toLowerCase()))
  )

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        {tool ? 'Modifica Strumento' : 'Nuovo Strumento'}
      </DialogTitle>
      
      <DialogContent>
        {formErrors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formErrors.general}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Tool Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Strumento
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
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
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
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
          
          <Grid size={{ xs: 12, sm: 4 }}>
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
          
          <Grid size={{ xs: 12, sm: 4 }}>
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
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Materiale"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
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

          {/* Part Association Section */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Associazione Parti
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={filteredParts}
              getOptionLabel={(option) => `${option.partNumber} - ${option.description || 'Senza descrizione'}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cerca e seleziona parti"
                  placeholder="Digita per cercare..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <Search sx={{ color: 'text.secondary', mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              onChange={(_, value) => {
                if (value) {
                  handlePartSelect(value)
                }
              }}
              loading={partsLoading}
              noOptionsText="Nessuna parte trovata"
              clearOnBlur
              selectOnFocus
            />
          </Grid>
          
          {selectedParts.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Parti associate ({selectedParts.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedParts.map((part) => (
                  <Chip
                    key={part.id}
                    label={`${part.partNumber} - ${part.description || 'Senza descrizione'}`}
                    onDelete={() => handlePartRemove(part.id)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Annulla
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}