'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Avatar,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  Print as PrintIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Timeline as TimelineIcon,
  Factory as FactoryIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Science as ScienceIcon,
  LocalFireDepartment as AutoclaveIcon,
  CleaningServices as CleanRoomIcon,
  Brush as VerniciatturaIcon,
  Construction as RifiltaturaIcon,
  Hexagon as HoneycombIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import QRCode from 'qrcode'
import Link from 'next/link'

interface ODL {
  id: string
  odlNumber: string
  status: string
  priority: string
  quantity: number
  expectedCompletionDate?: string
  createdAt: string
  updatedAt: string
  part: {
    id: string
    partNumber: string
    description: string
  }
  events: ProductionEvent[]
  curingCycle?: {
    id: string
    name: string
    duration: number
  }
}

interface ProductionEvent {
  id: string
  eventType: string
  timestamp: string
  notes?: string
  user: {
    id: string
    name: string
    email: string
  }
  department: {
    id: string
    name: string
    type: string
  }
  duration?: number
}

interface TransferDialogData {
  open: boolean
  targetDepartment: string
  notes: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`odl-tabpanel-${index}`}
      aria-labelledby={`odl-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'CREATED': 'info',
  'IN_CLEANROOM': 'primary',
  'CLEANROOM_COMPLETED': 'success',
  'IN_AUTOCLAVE': 'warning',
  'AUTOCLAVE_COMPLETED': 'success',
  'IN_NDI': 'secondary',
  'NDI_COMPLETED': 'success',
  'IN_RIFILATURA': 'primary',
  'RIFILATURA_COMPLETED': 'success',
  'COMPLETED': 'success',
  'ON_HOLD': 'warning',
  'CANCELLED': 'error'
}

const priorityColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'LOW': 'default',
  'NORMAL': 'primary',
  'HIGH': 'warning',
  'URGENT': 'error'
}

const departmentIcons: Record<string, React.ElementType> = {
  'CLEANROOM': CleanRoomIcon,
  'AUTOCLAVI': AutoclaveIcon,
  'NDI': ScienceIcon,
  'RIFILATURA': RifiltaturaIcon,
  'VERNICIATURA': VerniciatturaIcon,
  'HONEYCOMB': HoneycombIcon
}

const departments = [
  { id: 'cleanroom', name: 'Clean Room', type: 'CLEANROOM' },
  { id: 'autoclavi', name: 'Autoclavi', type: 'AUTOCLAVI' },
  { id: 'ndi', name: 'NDI', type: 'NDI' },
  { id: 'rifilatura', name: 'Rifilatura', type: 'RIFILATURA' },
  { id: 'verniciatura', name: 'Verniciatura', type: 'VERNICIATURA' }
]

export default function ODLDetailPage() {
  const params = useParams()
  const router = useRouter()
  const odlId = params.id as string

  const [odl, setOdl] = useState<ODL | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [currentTab, setCurrentTab] = useState(0)
  const [transferDialog, setTransferDialog] = useState<TransferDialogData>({
    open: false,
    targetDepartment: '',
    notes: ''
  })

  useEffect(() => {
    if (odlId) {
      fetchODLDetails()
    }
  }, [odlId])

  useEffect(() => {
    if (odl) {
      generateQRCode()
    }
  }, [odl])

  const fetchODLDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/odl/${odlId}`)
      
      if (!response.ok) {
        throw new Error('ODL non trovato')
      }

      const data = await response.json()
      setOdl(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (!odl) return

    try {
      const qrData = {
        type: 'ODL',
        id: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        timestamp: new Date().toISOString()
      }

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Errore nella generazione del QR code:', error)
    }
  }

  const handleTransfer = async () => {
    try {
      const response = await fetch('/api/workflow/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odlId: odl?.id,
          targetDepartment: transferDialog.targetDepartment,
          notes: transferDialog.notes
        })
      })

      if (!response.ok) {
        throw new Error('Errore nel trasferimento')
      }

      setTransferDialog({ open: false, targetDepartment: '', notes: '' })
      fetchODLDetails() // Refresh data
    } catch (error: any) {
      setError(error.message)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !odl) return

    const link = document.createElement('a')
    link.download = `QR_${odl.odlNumber}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const getTimelineDotColor = (eventType: string) => {
    switch (eventType) {
      case 'ENTRY':
        return 'primary'
      case 'EXIT':
        return 'success'
      case 'PAUSE':
        return 'warning'
      case 'RESUME':
        return 'info'
      case 'NOTE':
        return 'secondary'
      default:
        return 'primary'
    }
  }

  const getTimelineDotIcon = (eventType: string) => {
    switch (eventType) {
      case 'ENTRY':
        return <PlayIcon />
      case 'EXIT':
        return <CheckIcon />
      case 'PAUSE':
        return <StopIcon />
      case 'RESUME':
        return <PlayIcon />
      case 'NOTE':
        return <InfoIcon />
      default:
        return <InfoIcon />
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error || !odl) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'ODL non trovato'}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" gutterBottom>
              ODL {odl.odlNumber}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {odl.part.partNumber} - {odl.part.description}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={odl.status} 
                color={statusColors[odl.status] || 'default'}
                variant="filled"
              />
              <Chip 
                label={odl.priority} 
                color={priorityColors[odl.priority] || 'default'}
                variant="outlined"
                sx={{ bgcolor: 'primary.light' }}
              />
              <Chip 
                label={`Quantità: ${odl.quantity}`} 
                variant="outlined"
                sx={{ bgcolor: 'primary.light' }}
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
            {qrCodeUrl && (
              <Box>
                <img 
                  src={qrCodeUrl} 
                  alt={`QR Code ODL ${odl.odlNumber}`}
                  style={{ maxWidth: 120, height: 'auto', borderRadius: 8 }}
                />
                <Box sx={{ mt: 1 }}>
                  <Tooltip title="Scarica QR Code">
                    <IconButton 
                      onClick={downloadQRCode}
                      sx={{ color: 'primary.contrastText' }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={Link}
            href={`/production/odl/${odl.id}/edit`}
            sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Modifica
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => setTransferDialog({ ...transferDialog, open: true })}
            sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
          >
            Trasferisci
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            component={Link}
            href={`/qr-labels?odl=${odl.id}`}
            sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
          >
            Stampa Etichette
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
          >
            Condividi
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<TimelineIcon />} label="Storico Eventi" />
          <Tab icon={<CleanRoomIcon />} label="Clean Room" />
          <Tab icon={<AutoclaveIcon />} label="Autoclavi" />
          <Tab icon={<ScienceIcon />} label="NDI" />
          <Tab icon={<RifiltaturaIcon />} label="Rifilatura" />
          <Tab icon={<InfoIcon />} label="Dettagli Generali" />
        </Tabs>

        {/* Timeline Tab */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Storico Eventi di Produzione
          </Typography>
          
          {odl.events && odl.events.length > 0 ? (
            <Timeline>
              {odl.events.map((event, index) => {
                const DeptIcon = departmentIcons[event.department.type] || FactoryIcon
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} color="text.secondary">
                      <Typography variant="body2">
                        {format(new Date(event.timestamp), 'dd/MM/yyyy', { locale: it })}
                      </Typography>
                      <Typography variant="caption">
                        {format(new Date(event.timestamp), 'HH:mm', { locale: it })}
                      </Typography>
                    </TimelineOppositeContent>
                    
                    <TimelineSeparator>
                      <TimelineDot color={getTimelineDotColor(event.eventType)}>
                        {getTimelineDotIcon(event.eventType)}
                      </TimelineDot>
                      {index < odl.events.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DeptIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1">
                              {event.department.name} - {event.eventType}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Operatore: {event.user.name}
                          </Typography>
                          
                          {event.duration && (
                            <Typography variant="body2" color="primary">
                              Durata: {formatDuration(event.duration)}
                            </Typography>
                          )}
                          
                          {event.notes && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Note: {event.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </Timeline>
          ) : (
            <Alert severity="info">
              Nessun evento di produzione registrato per questo ODL.
            </Alert>
          )}
        </TabPanel>

        {/* Department Configuration Tabs */}
        {[1, 2, 3, 4].map((tabIndex) => {
          const deptNames = ['Clean Room', 'Autoclavi', 'NDI', 'Rifilatura']
          return (
            <TabPanel key={tabIndex} value={currentTab} index={tabIndex}>
              <Typography variant="h6" gutterBottom>
                Configurazione {deptNames[tabIndex - 1]}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Le configurazioni specifiche per {deptNames[tabIndex - 1]} verranno gestite 
                automaticamente man mano che l'ODL avanza nel workflow produttivo.
              </Alert>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Strumenti Richiesti
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gli strumenti necessari verranno assegnati automaticamente 
                        in base alla configurazione della parte quando l'ODL entra 
                        nel reparto {deptNames[tabIndex - 1]}.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Parametri di Processo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        I parametri specifici (temperature, pressioni, tempi) 
                        saranno configurati dal responsabile del reparto al 
                        momento dell'assegnazione.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          )
        })}

        {/* General Details Tab */}
        <TabPanel value={currentTab} index={5}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informazioni Generali
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">ID:</Typography>
                      <Typography variant="body2">{odl.id}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Data Creazione:</Typography>
                      <Typography variant="body2">
                        {format(new Date(odl.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Ultima Modifica:</Typography>
                      <Typography variant="body2">
                        {format(new Date(odl.updatedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </Typography>
                    </Box>
                    {odl.expectedCompletionDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">ECD:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {format(new Date(odl.expectedCompletionDate), 'dd/MM/yyyy', { locale: it })}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informazioni Parte
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Part Number:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {odl.part.partNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Descrizione:</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {odl.part.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {odl.curingCycle && (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ciclo di Cura
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Nome:</Typography>
                        <Typography variant="body2">{odl.curingCycle.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Durata:</Typography>
                        <Typography variant="body2">{odl.curingCycle.duration} minuti</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Transfer Dialog */}
      <Dialog 
        open={transferDialog.open} 
        onClose={() => setTransferDialog({ ...transferDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Trasferisci ODL</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Reparto Destinazione</InputLabel>
                <Select
                  value={transferDialog.targetDepartment}
                  label="Reparto Destinazione"
                  onChange={(e) => setTransferDialog({ ...transferDialog, targetDepartment: e.target.value })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.type}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Note (opzionale)"
                multiline
                rows={3}
                fullWidth
                value={transferDialog.notes}
                onChange={(e) => setTransferDialog({ ...transferDialog, notes: e.target.value })}
                placeholder="Note per il trasferimento..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog({ ...transferDialog, open: false })}>
            Annulla
          </Button>
          <Button 
            onClick={handleTransfer} 
            variant="contained"
            disabled={!transferDialog.targetDepartment}
          >
            Trasferisci
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}