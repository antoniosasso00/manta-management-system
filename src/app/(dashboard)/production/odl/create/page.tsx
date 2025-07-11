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
  expectedCompletionDate: z.date().optional(),
  notes: z.string().optional(),
  
  // Tool selection (required for production)
  toolId: z.string().cuid().optional(),
})

const createPartFormSchema = z.object({
  partNumber: z.string()
    .min(1, 'Il numero parte è obbligatorio')
    .regex(/^[A-Za-z0-9]+$/, 'Il numero parte deve contenere solo lettere e numeri'),
  description: z.string()
    .min(1, 'La descrizione è obbligatoria'),
})

type CreateODLForm = z.infer<typeof createODLFormSchema>
type CreatePartForm = z.infer<typeof createPartFormSchema>

interface Part {
  id: string
  partNumber: string
  description: string
  partTools?: PartTool[]
}

interface PartTool {
  id: string
  toolId: string
  tool: Tool
}

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
}


export default function CreateODLPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<Part[]>([])
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [availableTools, setAvailableTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [partsLoading, setPartsLoading] = useState(false)
  const [odlNumberCheck, setOdlNumberCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [createPartDialog, setCreatePartDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Main form
  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<CreateODLForm>({
    resolver: zodResolver(createODLFormSchema),
    defaultValues: {
      odlNumber: '',
      partId: '',
      quantity: 1,
      priority: 'NORMAL',
      expectedCompletionDate: undefined,
      notes: '',
      toolId: undefined,
    }
  })

  // Part creation form
  const { 
    control: partControl, 
    handleSubmit: handlePartSubmit, 
    formState: { errors: partErrors }, 
    reset: resetPartForm 
  } = useForm<CreatePartForm>({
    resolver: zodResolver(createPartFormSchema),
    defaultValues: {
      partNumber: '',
      description: '',
    }
  })

  const watchedOdlNumber = watch('odlNumber')


  // ODL number uniqueness check with debounce
  const debouncedOdlCheck = useCallback(
    debounce(async (odlNumber: string) => {
      // Extra safety check for undefined/null values
      if (odlNumber === undefined || odlNumber === null || typeof odlNumber !== 'string') {
        setOdlNumberCheck('idle')
        return
      }
      
      if (!odlNumber.trim()) {
        setOdlNumberCheck('idle')
        return
      }

      setOdlNumberCheck('checking')
      try {
        const response = await fetch(`/api/odl/check-unique?odlNumber=${encodeURIComponent(odlNumber.trim())}`)
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
    if (watchedOdlNumber !== undefined) {
      debouncedOdlCheck(watchedOdlNumber)
    }
  }, [watchedOdlNumber, debouncedOdlCheck])

  // Parts search with debounce
  const debouncedPartsSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm || !searchTerm.trim()) {
        setParts([])
        return
      }

      setPartsLoading(true)
      try {
        const response = await fetch(`/api/parts?search=${encodeURIComponent(searchTerm)}&limit=20&includeTools=true`)
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Sessione scaduta. Effettua nuovamente il login.')
            return
          }
          if (response.status === 403) {
            setError('Non hai i permessi per cercare le parti.')
            return
          }
          throw new Error(`Errore HTTP: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Handle both paginated response formats
        if (data.success && Array.isArray(data.data)) {
          // New standardized format
          setParts(data.data || [])
        } else if (Array.isArray(data.parts)) {
          // Legacy format
          setParts(data.parts || [])
        } else {
          console.error('Formato risposta API non valido:', data)
          setParts([])
        }
      } catch (error) {
        console.error('Error searching parts:', error)
        setError('Errore durante la ricerca delle parti.')
        setParts([])
      } finally {
        setPartsLoading(false)
      }
    }, 300),
    []
  )


  const handlePartSelection = (part: Part | null) => {
    setSelectedPart(part)
    if (part) {
      setValue('partId', part.id)
      
      // Handle tool selection based on available tools
      const tools = part.partTools?.map(pt => pt.tool) || []
      setAvailableTools(tools)
      
      if (tools.length === 1) {
        // Auto-select single tool
        const tool = tools[0]
        setSelectedTool(tool)
        setValue('toolId', tool.id)
      } else if (tools.length > 1) {
        // Multiple tools available - user must choose
        setSelectedTool(null)
        setValue('toolId', undefined)
      } else {
        // No tools available
        setSelectedTool(null)
        setValue('toolId', undefined)
      }
    } else {
      setValue('partId', '')
      setValue('toolId', undefined)
      setAvailableTools([])
      setSelectedTool(null)
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
      
      // Fetch the complete part with relations for ODL form
      try {
        const completePartResponse = await fetch(`/api/parts/${newPart.id}?include=partTools`)
        if (completePartResponse.ok) {
          const completePart = await completePartResponse.json()
          setSuccess(`Parte ${newPart.partNumber} creata con successo!`)
          setCreatePartDialog(false)
          resetPartForm()
          
          // Auto-select the complete part with relations
          handlePartSelection(completePart)
        } else {
          // Fallback to basic part if fetch fails
          handlePartSelection(newPart)
        }
      } catch (fetchError) {
        // Fallback to basic part if fetch fails
        console.warn('Could not fetch complete part data, using basic part:', fetchError)
        handlePartSelection(newPart)
      }
      
    } catch (error: any) {
      console.error('Errore creazione parte:', error)
      
      // Gestione errori specifici
      if (error.message.includes('already exists') || error.message.includes('unique constraint')) {
        setError('Part Number già esistente. Utilizzare un codice diverso.')
      } else if (error.message.includes('validation')) {
        setError('Dati non validi. Verificare il formato del Part Number.')
      } else {
        setError(error.message || 'Errore durante la creazione della parte.')
      }
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
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box component="li" key={key} {...otherProps}>
                                <Box>
                                  <Typography variant="subtitle2">{option.partNumber}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {option.description}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
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

                {/* Expected Completion Date */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="expectedCompletionDate"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value ? value.toISOString().split('T')[0] : ''}
                        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        label="Data Completamento Prevista (opzionale)"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().split('T')[0]
                        }}
                        placeholder="Seleziona data..."
                      />
                    )}
                  />
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

                {/* Tool Selection */}
                {availableTools.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Configurazione Avanzata
                    </Typography>
                    
                    {availableTools.length === 1 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Tool automaticamente selezionato: <strong>{availableTools[0].toolPartNumber}</strong>
                        {availableTools[0].description && ` - ${availableTools[0].description}`}
                      </Alert>
                    ) : (
                      <Controller
                        name="toolId"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Seleziona Tool</InputLabel>
                            <Select
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e.target.value)
                                const tool = availableTools.find(t => t.id === e.target.value)
                                setSelectedTool(tool || null)
                              }}
                              label="Seleziona Tool"
                            >
                              {availableTools.map((tool) => (
                                <MenuItem key={tool.id} value={tool.id}>
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {tool.toolPartNumber}
                                    </Typography>
                                    {tool.description && (
                                      <Typography variant="body2" color="text.secondary">
                                        {tool.description}
                                      </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {tool.base} x {tool.height} mm
                                      {tool.weight && ` • ${tool.weight} kg`}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    )}
                  </Grid>
                )}
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
                  
                  <Typography variant="body2">
                    <strong>Tool disponibili:</strong> {availableTools.length}
                  </Typography>
                  
                  {selectedTool && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Tool selezionato:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTool.toolPartNumber}
                      </Typography>
                      {selectedTool.description && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedTool.description}
                        </Typography>
                      )}
                    </Box>
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
                  <strong>Progressivo ODL:</strong> Inserisci manualmente un identificativo univoco per l&apos;ordine di lavoro.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Ricerca Parti:</strong> Digita codice parte o descrizione per trovare la parte da associare.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Selezione Tool:</strong> Seleziona il tool appropriato per la lavorazione della parte.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Se la parte ha un solo tool associato, sarà selezionato automaticamente. Le configurazioni specifiche per reparto sono gestite a livello di parte.
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
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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