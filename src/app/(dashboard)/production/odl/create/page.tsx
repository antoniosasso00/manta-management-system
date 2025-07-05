'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { debounce } from 'lodash'

// Form validation schema (matching API schema + additional validation)
const createODLFormSchema = z.object({
  odlNumber: z.string().min(1, 'Progressivo ODL è obbligatorio'),
  partId: z.string().cuid('Selezionare una parte'),
  quantity: z.number().int().min(1, 'Quantità deve essere almeno 1'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  notes: z.string().optional(),
  
  // Optional override fields
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  curingCycleId: z.string().cuid().optional(),
  vacuumLines: z.number().int().min(1).max(10).optional(),
})

const createPartFormSchema = z.object({
  partNumber: z.string().regex(/^[A-Z0-9]{8,12}$/, 'Part number deve essere 8-12 caratteri alfanumerici'),
  description: z.string().min(1, 'Descrizione è obbligatoria').max(255, 'Descrizione troppo lunga'),
})

type CreateODLForm = z.infer<typeof createODLFormSchema>
type CreatePartForm = z.infer<typeof createPartFormSchema>

interface Part {
  id: string
  partNumber: string
  description: string
  defaultCuringCycleId?: string
  defaultVacuumLines?: number
}

interface CuringCycle {
  id: string
  name: string
  duration: number
}

export default function CreateODLPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<Part[]>([])
  const [curingCycles, setCuringCycles] = useState<CuringCycle[]>([])
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [partsLoading, setPartsLoading] = useState(false)
  const [odlNumberCheck, setOdlNumberCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [createPartDialog, setCreatePartDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Main form
  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<CreateODLForm>({
    resolver: zodResolver(createODLFormSchema),
    defaultValues: {
      priority: 'NORMAL',
      quantity: 1,
    }
  })

  // Part creation form
  const { 
    control: partControl, 
    handleSubmit: handlePartSubmit, 
    formState: { errors: partErrors }, 
    reset: resetPartForm 
  } = useForm<CreatePartForm>({
    resolver: zodResolver(createPartFormSchema)
  })

  const watchedOdlNumber = watch('odlNumber')

  // Load curing cycles on mount
  useEffect(() => {
    loadCuringCycles()
  }, [])

  // ODL number uniqueness check with debounce
  const debouncedOdlCheck = useCallback(
    debounce(async (odlNumber: string) => {
      if (!odlNumber.trim()) {
        setOdlNumberCheck('idle')
        return
      }

      setOdlNumberCheck('checking')
      try {
        const response = await fetch(`/api/odl/check-unique?progressivo=${encodeURIComponent(odlNumber)}`)
        const data = await response.json()
        
        if (response.ok) {
          setOdlNumberCheck(data.isUnique ? 'available' : 'taken')
        } else {
          console.error('Errore validazione ODL:', data.error)
          setOdlNumberCheck('idle')
        }
      } catch (error) {
        console.error('Errore rete validazione ODL:', error)
        setOdlNumberCheck('idle')
      }
    }, 500),
    []
  )

  useEffect(() => {
    debouncedOdlCheck(watchedOdlNumber)
  }, [watchedOdlNumber, debouncedOdlCheck])

  // Parts search with debounce
  const debouncedPartsSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setParts([])
        return
      }

      setPartsLoading(true)
      try {
        const response = await fetch(`/api/parts?search=${encodeURIComponent(searchTerm)}&limit=20`)
        const data = await response.json()
        setParts(data.data || [])
      } catch (error) {
        console.error('Error searching parts:', error)
        setParts([])
      } finally {
        setPartsLoading(false)
      }
    }, 300),
    []
  )

  const loadCuringCycles = async () => {
    try {
      const response = await fetch('/api/curing-cycles')
      const data = await response.json()
      setCuringCycles(data.data || [])
    } catch (error) {
      console.error('Error loading curing cycles:', error)
    }
  }

  const handlePartSelection = (part: Part | null) => {
    setSelectedPart(part)
    if (part) {
      setValue('partId', part.id)
      
      // Auto-populate optional fields if they exist and are unique
      if (part.defaultCuringCycleId) {
        setValue('curingCycleId', part.defaultCuringCycleId)
      }
      if (part.defaultVacuumLines) {
        setValue('vacuumLines', part.defaultVacuumLines)
      }
    } else {
      setValue('partId', '')
    }
  }

  const handleCreatePart = async (data: CreatePartForm) => {
    try {
      const response = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nella creazione della parte')
      }

      const newPart = await response.json()
      setSuccess(`Parte ${newPart.partNumber} creata con successo!`)
      setCreatePartDialog(false)
      resetPartForm()
      
      // Auto-select the newly created part
      handlePartSelection(newPart)
      
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleCreateODL = async (data: CreateODLForm) => {
    if (odlNumberCheck === 'taken') {
      setError('Progressivo ODL già esistente')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/odl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nella creazione dell\'ODL')
      }

      const newODL = await response.json()
      setSuccess(`ODL ${newODL.odlNumber} creato con successo!`)
      
      // Reset form and redirect after a short delay
      setTimeout(() => {
        router.push(`/production/odl/${newODL.id}`)
      }, 1500)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getOdlNumberStatus = () => {
    switch (odlNumberCheck) {
      case 'checking':
        return { icon: <CircularProgress size={16} />, color: 'info' as const, text: 'Verifica...' }
      case 'available':
        return { icon: <CheckIcon />, color: 'success' as const, text: 'Disponibile' }
      case 'taken':
        return { icon: <WarningIcon />, color: 'error' as const, text: 'Già esistente' }
      default:
        return null
    }
  }

  const odlStatus = getOdlNumberStatus()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Crea Nuovo ODL
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Inserisci i dati per creare un nuovo Ordine di Lavoro
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleCreateODL)}>
        <Grid container spacing={4}>
          {/* Main Form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                Informazioni Principali
              </Typography>

              <Grid container spacing={3}>
                {/* ODL Number */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="odlNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Progressivo ODL"
                        fullWidth
                        error={!!errors.odlNumber || odlNumberCheck === 'taken'}
                        helperText={errors.odlNumber?.message}
                        InputProps={{
                          endAdornment: odlStatus && (
                            <Tooltip title={odlStatus.text}>
                              <Box sx={{ color: `${odlStatus.color}.main`, display: 'flex', alignItems: 'center' }}>
                                {odlStatus.icon}
                              </Box>
                            </Tooltip>
                          )
                        }}
                        placeholder="es. ODL-2024-001"
                      />
                    )}
                  />
                </Grid>

                {/* Quantity */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
                        label="Quantità"
                        type="number"
                        fullWidth
                        error={!!errors.quantity}
                        helperText={errors.quantity?.message}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    )}
                  />
                </Grid>

                {/* Part Selection */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Controller
                      name="partId"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          sx={{ flexGrow: 1 }}
                          options={parts}
                          getOptionLabel={(option) => 
                            typeof option === 'string' ? option : `${option.partNumber} - ${option.description}`
                          }
                          isOptionEqualToValue={(option, value) => 
                            option.id === (value?.id || value)
                          }
                          value={selectedPart}
                          onChange={(_, value) => handlePartSelection(value)}
                          onInputChange={(_, value) => debouncedPartsSearch(value)}
                          loading={partsLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Ricerca Parte"
                              error={!!errors.partId}
                              helperText={errors.partId?.message}
                              placeholder="Digita codice o descrizione..."
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {partsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Box>
                                <Typography variant="subtitle2">{option.partNumber}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {option.description}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          noOptionsText="Nessuna parte trovata"
                        />
                      )}
                    />
                    
                    <Tooltip title="Crea Nuova Parte">
                      <IconButton 
                        color="primary" 
                        onClick={() => setCreatePartDialog(true)}
                        sx={{ mt: 1 }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                {/* Priority */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Priorità</InputLabel>
                        <Select {...field} label="Priorità">
                          <MenuItem value="LOW">
                            <Chip label="Bassa" color="default" size="small" sx={{ mr: 1 }} />
                            Bassa
                          </MenuItem>
                          <MenuItem value="NORMAL">
                            <Chip label="Normale" color="primary" size="small" sx={{ mr: 1 }} />
                            Normale
                          </MenuItem>
                          <MenuItem value="HIGH">
                            <Chip label="Alta" color="warning" size="small" sx={{ mr: 1 }} />
                            Alta
                          </MenuItem>
                          <MenuItem value="URGENT">
                            <Chip label="Urgente" color="error" size="small" sx={{ mr: 1 }} />
                            Urgente
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Notes */}
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Note (opzionale)"
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Note aggiuntive per l'ODL..."
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Configurazioni Avanzate (Opzionali)
              </Typography>
              
              <Grid container spacing={3}>
                {/* Dimensions Override */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="length"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
                        label="Lunghezza (mm)"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="width"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
                        label="Larghezza (mm)"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="height"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
                        label="Altezza (mm)"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                      />
                    )}
                  />
                </Grid>

                {/* Curing Cycle */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="curingCycleId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Ciclo di Cura (override)</InputLabel>
                        <Select {...field} value={field.value || ''} label="Ciclo di Cura (override)">
                          <MenuItem value="">
                            <em>Usa default della parte</em>
                          </MenuItem>
                          {curingCycles.map((cycle) => (
                            <MenuItem key={cycle.id} value={cycle.id}>
                              {cycle.name} ({cycle.duration}min)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Vacuum Lines */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="vacuumLines"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
                        label="Linee Vacuum (override)"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 1, max: 10 } }}
                        placeholder="Default della parte"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Side Panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Selected Part Info */}
            {selectedPart && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Parte Selezionata
                  </Typography>
                  <Typography variant="subtitle1" color="primary">
                    {selectedPart.partNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedPart.description}
                  </Typography>
                  
                  {selectedPart.defaultCuringCycleId && (
                    <Typography variant="body2">
                      <strong>Ciclo Default:</strong> Configurato
                    </Typography>
                  )}
                  {selectedPart.defaultVacuumLines && (
                    <Typography variant="body2">
                      <strong>Linee Vacuum:</strong> {selectedPart.defaultVacuumLines}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Informazioni
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  <strong>Progressivo ODL:</strong> Inserisci manualmente un identificativo univoco per l'ordine di lavoro.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Ricerca Parti:</strong> Digita codice parte o descrizione per trovare la parte da associare.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Configurazioni Avanzate:</strong> Se specificate, sovrascrivono i valori di default della parte.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  I tool e le configurazioni specifiche per reparto verranno gestite man mano che l'ODL avanza nel workflow.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => router.back()}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || odlNumberCheck === 'taken'}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Crea ODL'}
          </Button>
        </Box>
      </form>

      {/* Create Part Dialog */}
      <Dialog 
        open={createPartDialog} 
        onClose={() => setCreatePartDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handlePartSubmit(handleCreatePart)}>
          <DialogTitle>Crea Nuova Parte</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="partNumber"
                  control={partControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Part Number"
                      fullWidth
                      error={!!partErrors.partNumber}
                      helperText={partErrors.partNumber?.message}
                      placeholder="es. 8G5350A0123"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={partControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Descrizione"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!partErrors.description}
                      helperText={partErrors.description?.message}
                      placeholder="Descrizione della parte..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreatePartDialog(false)}>
              Annulla
            </Button>
            <Button type="submit" variant="contained">
              Crea Parte
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}