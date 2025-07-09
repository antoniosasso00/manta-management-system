'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Typography
} from '@mui/material'
import { 
  Timer,
  Settings,
  Build,
  Science,
  Palette,
  Inventory,
  Engineering,
  Speed
} from '@mui/icons-material'
import { ExtensionTableConfig, ExtensionTableData, CommonSelectOptions, ExtensionField } from './types'

interface ExtensionTableDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: Record<string, any>) => void
  config: ExtensionTableConfig
  editingItem: ExtensionTableData | null
  commonOptions: CommonSelectOptions
  mockData?: boolean
}

const getFieldIcon = (fieldName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    setupTime: <Timer color="action" />,
    cycleTime: <Timer color="action" />,
    inspectionTime: <Timer color="action" />,
    testingTime: <Timer color="action" />,
    assemblyTime: <Timer color="action" />,
    programmingTime: <Timer color="action" />,
    dryTime: <Timer color="action" />,
    cureTime: <Timer color="action" />,
    vacuumLines: <Settings color="action" />,
    pressure: <Settings color="action" />,
    vacuumLevel: <Settings color="action" />,
    powerRating: <Speed color="action" />,
    toolingRequired: <Build color="action" />,
    toolsRequired: <Build color="action" />,
    materialType: <Inventory color="action" />,
    skinMaterial: <Inventory color="action" />,
    resinType: <Science color="action" />,
    adhesiveType: <Science color="action" />,
    fuelType: <Science color="action" />,
    coatingType: <Palette color="action" />,
    engineType: <Engineering color="action" />,
    inspectionMethod: <Science color="action" />
  }
  return iconMap[fieldName] || null
}

export function ExtensionTableDialog({
  open,
  onClose,
  onSubmit,
  config,
  editingItem,
  commonOptions,
  mockData = false
}: ExtensionTableDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Inizializza i dati del form
  useEffect(() => {
    if (editingItem) {
      const initialData: Record<string, any> = {}
      config.fields.forEach(field => {
        const value = (editingItem as any)[field.name]
        if (value !== undefined) {
          initialData[field.name] = value
        } else {
          initialData[field.name] = field.defaultValue || ''
        }
      })
      setFormData(initialData)
    } else {
      const initialData: Record<string, any> = {}
      config.fields.forEach(field => {
        initialData[field.name] = field.defaultValue || ''
      })
      setFormData(initialData)
    }
    setErrors({})
  }, [editingItem, config.fields, open])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Rimuovi errore se presente
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    config.fields.forEach(field => {
      const value = formData[field.name]
      
      // Validazione required
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = 'Campo obbligatorio'
      }
      
      // Validazione custom
      if (field.validation && value) {
        const validationError = field.validation(value)
        if (validationError) {
          newErrors[field.name] = validationError
        }
      }
      
      // Validazione numerica
      if (field.type === 'number' && value) {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          newErrors[field.name] = 'Deve essere un numero'
        } else {
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.name] = `Il valore minimo è ${field.min}`
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.name] = `Il valore massimo è ${field.max}`
          }
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    
    const submitData = { ...formData }
    
    // Converti i valori numerici
    config.fields.forEach(field => {
      if (field.type === 'number' && submitData[field.name]) {
        submitData[field.name] = Number(submitData[field.name])
      }
    })
    
    onSubmit(submitData)
  }

  const renderField = (field: ExtensionField) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]
    const icon = getFieldIcon(field.name)

    switch (field.type) {
      case 'autocomplete':
        if (field.name === 'partId') {
          return (
            <Autocomplete
              key={field.name}
              options={commonOptions.parts}
              getOptionLabel={(option) => `${option.partNumber} - ${option.description}`}
              value={commonOptions.parts.find(p => p.id === value) || null}
              onChange={(_, newValue) => handleFieldChange(field.name, newValue?.id || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={field.label} 
                  required={field.required}
                  error={!!error}
                  helperText={error || field.helperText}
                />
              )}
              disabled={field.disabled || (!!editingItem && field.name === 'partId')}
            />
          )
        }
        
        if (field.name === 'curingCycleId' && commonOptions.curingCycles) {
          return (
            <Autocomplete
              key={field.name}
              options={commonOptions.curingCycles}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={commonOptions.curingCycles.find(c => c.id === value) || null}
              onChange={(_, newValue) => handleFieldChange(field.name, newValue?.id || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={field.label} 
                  required={field.required}
                  error={!!error}
                  helperText={error || field.helperText}
                />
              )}
              disabled={field.disabled}
            />
          )
        }
        
        return (
          <Autocomplete
            key={field.name}
            options={field.options || []}
            getOptionLabel={(option) => option.label}
            value={field.options?.find(o => o.value === value) || null}
            onChange={(_, newValue) => handleFieldChange(field.name, newValue?.value || '')}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label={field.label} 
                required={field.required}
                error={!!error}
                helperText={error || field.helperText}
              />
            )}
            disabled={field.disabled}
          />
        )

      case 'select':
        return (
          <TextField
            key={field.name}
            select
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">{field.required ? 'Seleziona...' : 'Nessuno'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
        )

      case 'multiline':
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            multiline
            rows={field.rows || 3}
            InputProps={{
              startAdornment: icon ? <Box sx={{ mr: 1 }}>{icon}</Box> : undefined,
            }}
          />
        )

      case 'number':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            inputProps={{ 
              min: field.min, 
              max: field.max 
            }}
            InputProps={{
              startAdornment: icon ? <Box sx={{ mr: 1 }}>{icon}</Box> : undefined,
              endAdornment: field.unit ? <InputAdornment position="end">{field.unit}</InputAdornment> : undefined
            }}
          />
        )

      case 'boolean':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                disabled={field.disabled}
              />
            }
            label={field.label}
          />
        )

      case 'time':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            InputProps={{
              startAdornment: icon ? <Box sx={{ mr: 1 }}>{icon}</Box> : undefined,
            }}
          />
        )

      default: // text
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            InputProps={{
              startAdornment: icon ? <Box sx={{ mr: 1 }}>{icon}</Box> : undefined,
            }}
          />
        )
    }
  }

  const isFormValid = () => {
    return config.fields
      .filter(field => field.required)
      .every(field => formData[field.name] && formData[field.name] !== '')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingItem ? `Modifica ${config.displayName}` : `Nuova ${config.displayName}`}
        {mockData && (
          <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
            (MOCKUP)
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {config.fields.map(field => renderField(field))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!isFormValid()}
        >
          {editingItem ? 'Salva Modifiche' : 'Crea'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}