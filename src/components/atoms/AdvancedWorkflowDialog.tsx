'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  Chip,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
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
  CheckCircle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Warning,
  ArrowForward,
  AccessTime,
  Person,
  CalendarToday
} from '@mui/icons-material'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ODL, ProductionEvent, Department, ODLStatus } from '@prisma/client'

interface ExtendedODL extends ODL {
  part: {
    partNumber: string
    description: string
  }
  productionEvents?: ProductionEvent[]
  currentDepartment?: Department
}

interface AdvancedWorkflowDialogProps {
  open: boolean
  onClose: () => void
  odl: ExtendedODL | null
  currentDepartment: Department
  availableDepartments: Department[]
  onTransfer: (targetDepartmentId: string, notes?: string) => Promise<void>
  onStatusChange: (newStatus: ODLStatus, notes?: string) => Promise<void>
  loading?: boolean
}

export function AdvancedWorkflowDialog({
  open,
  onClose,
  odl,
  currentDepartment,
  availableDepartments,
  onTransfer,
  onStatusChange,
  loading = false
}: AdvancedWorkflowDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [notes, setNotes] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  if (!odl) return null

  // Filtra eventi rilevanti per questo ODL
  const relevantEvents = odl.productionEvents?.filter(
    event => event.odlId === odl.id
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || []

  // Calcola tempo totale nel reparto corrente
  const currentDepartmentTime = relevantEvents
    .filter(event => event.departmentId === currentDepartment.id)
    .reduce((total, event, index, array) => {
      if (event.eventType === 'ENTRY' && index > 0) {
        const exitEvent = array.find(
          (e, i) => i < index && e.eventType === 'EXIT'
        )
        if (exitEvent) {
          return total + (new Date(exitEvent.timestamp).getTime() - new Date(event.timestamp).getTime())
        }
      }
      return total
    }, 0)

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleTransfer = async () => {
    if (!selectedDepartment) {
      setError('Seleziona un reparto di destinazione')
      return
    }

    setError(null)
    try {
      await onTransfer(selectedDepartment, notes)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il trasferimento')
    }
  }

  const handleStatusChange = async (newStatus: ODLStatus) => {
    setError(null)
    try {
      await onStatusChange(newStatus, notes)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il cambio stato')
    }
  }

  const handleClose = () => {
    setSelectedDepartment('')
    setNotes('')
    setActiveStep(0)
    setError(null)
    onClose()
  }

  const getStatusIcon = (status: ODLStatus) => {
    switch (status) {
      case 'CREATED':
        return <PlayCircle color="info" />
      case 'IN_CLEANROOM':
      case 'IN_AUTOCLAVE':
      case 'IN_NDI':
      case 'IN_CONTROLLO_NUMERICO':
      case 'IN_MONTAGGIO':
      case 'IN_VERNICIATURA':
        return <PlayCircle color="success" />
      case 'ON_HOLD':
        return <PauseCircle color="warning" />
      case 'COMPLETED':
        return <CheckCircle color="success" />
      case 'CANCELLED':
        return <StopCircle color="error" />
      default:
        return <Warning color="disabled" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ENTRY':
        return <TimelineDot color="success"><PlayCircle /></TimelineDot>
      case 'EXIT':
        return <TimelineDot color="error"><StopCircle /></TimelineDot>
      case 'PAUSE':
        return <TimelineDot color="warning"><PauseCircle /></TimelineDot>
      case 'RESUME':
        return <TimelineDot color="info"><PlayCircle /></TimelineDot>
      default:
        return <TimelineDot />
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Gestione Avanzata Workflow - ODL {odl.odlNumber}
          </Typography>
          <Chip 
            label={odl.status} 
            icon={getStatusIcon(odl.status)}
            color={odl.status === 'COMPLETED' ? 'success' : 'default'}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Informazioni ODL */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Part Number: <strong>{odl.part.partNumber}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {odl.part.description}
          </Typography>
          <Box display="flex" gap={2} mt={1}>
            <Chip 
              size="small" 
              label={`Priorità: ${odl.priority}`}
              color={odl.priority === 'URGENT' ? 'error' : 'default'}
            />
            <Chip 
              size="small" 
              label={`Quantità: ${odl.quantity}`}
            />
            <Chip 
              size="small" 
              label={`Tempo nel reparto: ${formatDuration(currentDepartmentTime)}`}
              icon={<AccessTime />}
            />
          </Box>
        </Paper>

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Storico Eventi */}
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">
                Storico Eventi Produzione
              </Typography>
            </StepLabel>
            <StepContent>
              <Timeline position="alternate">
                {relevantEvents.slice(0, 5).map((event, index) => (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(event.timestamp), 'dd/MM HH:mm', { locale: it })}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      {getEventIcon(event.eventType)}
                      {index < relevantEvents.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2">
                        {event.eventType} - {event.departmentId}
                      </Typography>
                      {event.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {event.notes}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
              <Box mt={2}>
                <Button onClick={() => setActiveStep(1)} variant="contained">
                  Avanti
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Azioni Disponibili */}
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">
                Azioni Workflow
              </Typography>
            </StepLabel>
            <StepContent>
              <List>
                {/* Trasferimento Manuale */}
                <ListItem>
                  <ListItemIcon>
                    <ArrowForward color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Trasferimento Manuale"
                    secondary="Trasferisci l'ODL a un altro reparto"
                  />
                </ListItem>
                
                <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                  <InputLabel>Reparto di Destinazione</InputLabel>
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    label="Reparto di Destinazione"
                  >
                    {availableDepartments
                      .filter(dept => dept.id !== currentDepartment.id)
                      .map(dept => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.type})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <Divider sx={{ my: 2 }} />

                {/* Cambio Stato */}
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cambio Stato Manuale"
                    secondary="Modifica lo stato dell'ODL"
                  />
                </ListItem>

                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleStatusChange('ON_HOLD')}
                    disabled={odl.status === 'ON_HOLD'}
                  >
                    Pausa
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // Determina lo stato corretto in base al reparto
                      const departmentType = currentDepartment.type;
                      const targetStatus = `IN_${departmentType}` as ODLStatus;
                      handleStatusChange(targetStatus);
                    }}
                    disabled={odl.status.includes('IN_')}
                  >
                    Riprendi Lavorazione
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={odl.status === 'CANCELLED'}
                  >
                    Annulla
                  </Button>
                </Box>
              </List>

              <Box mt={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Note (opzionale)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Aggiungi note per questa operazione..."
                />
              </Box>

              <Box mt={2} display="flex" gap={1}>
                <Button onClick={() => setActiveStep(0)}>
                  Indietro
                </Button>
                <Button 
                  onClick={handleTransfer} 
                  variant="contained"
                  disabled={!selectedDepartment || loading}
                >
                  Esegui Trasferimento
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  )
}