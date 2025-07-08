'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DepartmentConfigurationSection from '@/components/production/DepartmentConfigurationSection'
import { debounce } from 'lodash'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Form validation schema with enhanced Part Number validation
const editODLFormSchema = z.object({
  odlNumber: z.string().min(1, 'Progressivo ODL è obbligatorio'),
  partId: z.string().cuid('Selezionare una parte'),
  quantity: z.number().int().min(1, 'Quantità deve essere almeno 1'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  expectedCompletionDate: z.date().optional(),
  notes: z.string().optional(),
  
  // Optional override fields
  curingCycleId: z.string().cuid().optional(),
  vacuumLines: z.number().int().min(1).max(10).optional(),
})

type EditODLForm = z.infer<typeof editODLFormSchema>

interface ODL {
  id: string
  odlNumber: string
  status: string
  priority: string
  quantity: number
  notes?: string
  part: {
    id: string
    partNumber: string
    description: string
  }
  curingCycle?: {
    id: string
    name: string
  }
}

interface Part {
  id: string
  partNumber: string
  description: string
}

interface CuringCycle {
  id: string
  name: string
  duration: number
}

interface ChangeLog {
  id: string
  field: string
  oldValue: string
  newValue: string
  timestamp: string
  user: {
    name: string
    email: string
  }
}

interface PartNumberChangeDialog {
  open: boolean
  newPartNumber: string
  countdown: number
  confirmed: boolean
}

export default function EditODLPage() {
  const params = useParams()
  const router = useRouter()
  const odlId = params.id as string

  const [odl, setOdl] = useState<ODL | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [curingCycles, setCuringCycles] = useState<CuringCycle[]>([])
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [loading, setLoading] = useState(false)
  const [partsLoading, setPartsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [odlNumberCheck, setOdlNumberCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [partNumberDialog, setPartNumberDialog] = useState<PartNumberChangeDialog>({
    open: false,
    newPartNumber: '',
    countdown: 0,
    confirmed: false
  })

  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<EditODLForm>({
    resolver: zodResolver(editODLFormSchema),
  })

  const watchedOdlNumber = watch('odlNumber')
  const watchedPartId = watch('partId')

  const fetchODLDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/odl/${odlId}`)
      
      if (!response.ok) {
        throw new Error('ODL non trovato')
      }

      const data = await response.json()
      setOdl(data)
      
      // Populate form with current data
      reset({
        odlNumber: data.odlNumber,
        partId: data.part.id,
        quantity: data.quantity,
        priority: data.priority,
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : undefined,
        notes: data.notes || '',
      })
      
      setSelectedPart(data.part)
    } catch (error: any) {
      setError(error.message)
    }
  }, [odlId, reset])

  const fetchChangeLogs = useCallback(async () => {
    // Mock change logs - in production this would come from API
    const mockLogs: ChangeLog[] = [
      {
        id: '1',
        field: 'priority',
        oldValue: 'NORMAL',
        newValue: 'HIGH',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        user: { name: 'Mario Rossi', email: 'mario.rossi@manta.com' }
      },
      {
        id: '2',
        field: 'quantity',
        oldValue: '1',
        newValue: '2',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        user: { name: 'Anna Verdi', email: 'anna.verdi@manta.com' }
      }
    ]
    setChangeLogs(mockLogs)
  }, [])

  const loadCuringCycles = useCallback(async () => {
    try {
      const response = await fetch('/api/curing-cycles')
      const data = await response.json()
      setCuringCycles(data.data || [])
    } catch (error) {
      console.error('Error loading curing cycles:', error)
    }
  }, [])

  useEffect(() => {
    if (odlId) {
      fetchODLDetails()
      fetchChangeLogs()
      loadCuringCycles()
    }
  }, [odlId, fetchODLDetails, fetchChangeLogs, loadCuringCycles])

  // ODL number uniqueness check with debounce (excluding current ODL)
  const debouncedOdlCheck = useCallback(
    debounce(async (odlNumber: string) => {
      if (!odlNumber.trim() || !odl) {
        setOdlNumberCheck('idle')
        return
      }

      // Skip check if it's the same as current ODL number
      if (odlNumber === odl.odlNumber) {
        setOdlNumberCheck('idle')
        return
      }

      setOdlNumberCheck('checking')
      try {
        const response = await fetch(`/api/odl?search=${encodeURIComponent(odlNumber)}`)
        const data = await response.json()
        
        const exists = data.data?.some((existingOdl: any) => 
          existingOdl.odlNumber.toLowerCase() === odlNumber.toLowerCase() && 
          existingOdl.id !== odl.id
        )
        setOdlNumberCheck(exists ? 'taken' : 'available')
      } catch {
        setOdlNumberCheck('idle')
      }
    }, 500),
    [odl]
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

  const handlePartSelection = (part: Part | null) => {
    setSelectedPart(part)
    if (part) {
      setValue('partId', part.id)
      
      // Check if Part Number change requires confirmation
      if (odl && part.partNumber !== odl.part.partNumber) {
        setPartNumberDialog({
          open: true,
          newPartNumber: part.partNumber,
          countdown: 3,
          confirmed: false
        })
        
        // Start countdown
        const countdownInterval = setInterval(() => {
          setPartNumberDialog(prev => {
            if (prev.countdown <= 1) {
              clearInterval(countdownInterval)
              return { ...prev, countdown: 0, confirmed: true }
            }
            return { ...prev, countdown: prev.countdown - 1 }
          })
        }, 1000)
      }
    } else {
      setValue('partId', '')
    }
  }

  const confirmPartNumberChange = () => {
    setPartNumberDialog({ open: false, newPartNumber: '', countdown: 0, confirmed: false })
    // Part is already selected, no additional action needed
  }

  const cancelPartNumberChange = () => {
    setPartNumberDialog({ open: false, newPartNumber: '', countdown: 0, confirmed: false })
    // Revert to original part
    if (odl) {
      setSelectedPart(odl.part)
      setValue('partId', odl.part.id)
    }
  }

  const handleSaveODL = async (data: EditODLForm) => {
    if (odlNumberCheck === 'taken') {
      setError('Progressivo ODL già esistente')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/odl/${odlId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nella modifica dell\'ODL')
      }

      setSuccess('ODL modificato con successo!')
      
      // Refresh data
      fetchODLDetails()
      fetchChangeLogs()
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/production/odl/${odlId}`)
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

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'priority': 'Priorità',
      'quantity': 'Quantità',
      'odlNumber': 'Progressivo ODL',
      'partId': 'Parte',
      'notes': 'Note',
    }
    return labels[field] || field
  }

  if (!odl) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const odlStatus = getOdlNumberStatus()

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Modifica ODL {odl.odlNumber}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Modifica i dati dell&apos;Ordine di Lavoro. Tutte le modifiche saranno registrate nel log.
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

      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni ODL
            </Typography>

            <form onSubmit={handleSubmit(handleSaveODL)}>
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
                  <Controller
                    name="partId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
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
                            label="Parte"
                            error={!!errors.partId}
                            helperText={errors.partId?.message || 'Attenzione: modificare la parte richiede conferma'}
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
                        label="Note"
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Note per l'ODL..."
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <DepartmentConfigurationSection
                control={control}
                errors={errors}
                curingCycles={curingCycles}
                mode="edit"
              />

              {/* Actions */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => router.push(`/production/odl/${odlId}`)}
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
                  {loading ? <CircularProgress size={24} /> : 'Salva Modifiche'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* Change Log Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HistoryIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Log Modifiche
              </Typography>
            </Box>

            {changeLogs.length > 0 ? (
              <Timeline sx={{ p: 0 }}>
                {changeLogs.map((log, index) => (
                  <TimelineItem key={log.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0', minWidth: 0, flex: 0.2 }} color="text.secondary">
                      <Typography variant="caption">
                        {format(new Date(log.timestamp), 'dd/MM', { locale: it })}
                      </Typography>
                    </TimelineOppositeContent>
                    
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        <EditIcon sx={{ fontSize: 16 }} />
                      </TimelineDot>
                      {index < changeLogs.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {getFieldLabel(log.field)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <del style={{ color: '#f44336' }}>{log.oldValue}</del>
                        {' → '}
                        <span style={{ color: '#2e7d32' }}>{log.newValue}</span>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {log.user.name}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Alert severity="info">
                Nessuna modifica registrata per questo ODL.
              </Alert>
            )}
          </Paper>

          {/* Selected Part Info */}
          {selectedPart && (
            <Card sx={{ mt: 3 }}>
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
                
                {selectedPart.partNumber !== odl.part.partNumber && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Attenzione:</strong> Stai modificando la parte da 
                      <strong> {odl.part.partNumber}</strong> a 
                      <strong> {selectedPart.partNumber}</strong>. 
                      Questa modifica richiederà conferma.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Part Number Change Confirmation Dialog */}
      <Dialog 
        open={partNumberDialog.open} 
        onClose={cancelPartNumberChange}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Conferma Modifica Parte
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" paragraph>
              <strong>ATTENZIONE:</strong> Stai per modificare la parte associata a questo ODL.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Da:</strong> {odl?.part.partNumber} - {odl?.part.description}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>A:</strong> {partNumberDialog.newPartNumber}
            </Typography>
            <Typography variant="body2">
              Questa modifica può avere impatti significativi sui parametri di produzione, 
              cicli di cura e strumenti necessari.
            </Typography>
          </Alert>

          {partNumberDialog.countdown > 0 && (
            <Alert severity="info">
              Attendi {partNumberDialog.countdown} secondi prima di poter confermare...
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPartNumberChange}>
            Annulla
          </Button>
          <Button 
            onClick={confirmPartNumberChange} 
            variant="contained"
            color="warning"
            disabled={!partNumberDialog.confirmed || partNumberDialog.countdown > 0}
          >
            {partNumberDialog.countdown > 0 ? 
              `Conferma (${partNumberDialog.countdown})` : 
              'Conferma Modifica'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}