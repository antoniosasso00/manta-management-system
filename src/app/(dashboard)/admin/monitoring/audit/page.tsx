'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material'
import {
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Factory as FactoryIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon,
  Key as AuthIcon,
  ManageAccounts as UserMgmtIcon,
  BusinessCenter as BusinessIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import AuditCharts from '@/components/audit/AuditCharts'

interface AuditEvent {
  id: string
  eventType: string
  category: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  details: {
    action: string
    resource: string
    resourceId?: string
    ipAddress: string
    success: boolean
    errorMessage?: string
  }
  department?: {
    name: string
    type: string
  }
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
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const eventCategories = {
  'AUTHENTICATION': { icon: AuthIcon, color: 'primary', label: 'Autenticazione' },
  'USER_MANAGEMENT': { icon: UserMgmtIcon, color: 'secondary', label: 'Gestione Utenti' },
  'ODL_OPERATIONS': { icon: BusinessIcon, color: 'success', label: 'Operazioni ODL' },
  'PRODUCTION_EVENTS': { icon: FactoryIcon, color: 'warning', label: 'Eventi Produzione' },
  'SYSTEM_EVENTS': { icon: SettingsIcon, color: 'info', label: 'Eventi Sistema' },
  'SECURITY_EVENTS': { icon: SecurityIcon, color: 'error', label: 'Eventi Sicurezza' }
} as const

const severityColors = {
  'LOW': 'success',
  'MEDIUM': 'warning', 
  'HIGH': 'error',
  'CRITICAL': 'error'
} as const

export default function AdminAuditPage() {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState(0)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Table state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Mock data per demonstration - Sarà sostituito da API reale
  const mockEvents: AuditEvent[] = [
    {
      id: '1',
      eventType: 'LOGIN_SUCCESS',
      category: 'AUTHENTICATION',
      severity: 'LOW',
      timestamp: new Date().toISOString(),
      user: {
        id: 'user1',
        name: 'Mario Rossi',
        email: 'mario.rossi@manta.com',
        role: 'OPERATOR'
      },
      details: {
        action: 'Accesso effettuato',
        resource: 'Sistema',
        ipAddress: '192.168.1.100',
        success: true
      }
    },
    {
      id: '2',
      eventType: 'ODL_CREATED',
      category: 'ODL_OPERATIONS',
      severity: 'MEDIUM',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: {
        id: 'user2',
        name: 'Anna Verdi',
        email: 'anna.verdi@manta.com',
        role: 'SUPERVISOR'
      },
      details: {
        action: 'Creazione ODL',
        resource: 'ODL',
        resourceId: 'ODL-2024-001',
        ipAddress: '192.168.1.105',
        success: true
      },
      department: {
        name: 'Clean Room',
        type: 'CLEANROOM'
      }
    },
    {
      id: '3',
      eventType: 'FAILED_LOGIN',
      category: 'SECURITY_EVENTS',
      severity: 'HIGH',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: {
        id: 'unknown',
        name: 'Tentativo Non Autorizzato',
        email: 'unknown@invalid.com',
        role: 'UNKNOWN'
      },
      details: {
        action: 'Tentativo accesso fallito',
        resource: 'Sistema',
        ipAddress: '185.220.101.50',
        success: false,
        errorMessage: 'Credenziali non valide'
      }
    },
    {
      id: '4',
      eventType: 'USER_UPDATED',
      category: 'USER_MANAGEMENT',
      severity: 'MEDIUM',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      user: {
        id: 'admin1',
        name: 'Admin Sistema',
        email: 'admin@manta.com',
        role: 'ADMIN'
      },
      details: {
        action: 'Modifica utente',
        resource: 'User',
        resourceId: 'user123',
        ipAddress: '192.168.1.10',
        success: true
      }
    }
  ]

  const loadAuditData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Sostituire con chiamata API reale quando sarà implementata
      await new Promise(resolve => setTimeout(resolve, 500)) // Simula loading
      setAuditEvents(mockEvents)
      
    } catch (error: any) {
      setError('Errore nel caricamento dei dati di audit')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuditData()
  }, [loadAuditData])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAuditData()
      }, 30000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, loadAuditData])

  const handleExport = () => {
    // TODO: Implementare esportazione quando saranno definiti i requisiti
    alert('Funzione di esportazione da implementare - Richiede specifiche sui formati e contenuti')
  }

  const getEventIcon = (category: string) => {
    const categoryConfig = eventCategories[category as keyof typeof eventCategories]
    if (!categoryConfig) return InfoIcon
    return categoryConfig.icon
  }

  const getEventColor = (category: string) => {
    const categoryConfig = eventCategories[category as keyof typeof eventCategories]
    return categoryConfig?.color || 'default'
  }

  const filteredEvents = auditEvents.filter(event => {
    if (searchTerm && !event.details.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    if (filterCategory && event.category !== filterCategory) return false
    if (filterSeverity && event.severity !== filterSeverity) return false
    
    return true
  })

  // Metriche calcolate
  const totalEvents = auditEvents.length
  const successfulEvents = auditEvents.filter(e => e.details.success).length
  const failedEvents = totalEvents - successfulEvents
  const criticalEvents = auditEvents.filter(e => e.severity === 'CRITICAL').length
  const uniqueUsers = new Set(auditEvents.map(e => e.user.id)).size

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sistema Audit e Monitoring
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Dashboard completo per il monitoraggio di tutti gli eventi del sistema MES
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metrics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalEvents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eventi Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {successfulEvents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successi
              </Typography>
              <Typography variant="caption" color="success.main">
                {totalEvents > 0 ? ((successfulEvents / totalEvents) * 100).toFixed(1) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {failedEvents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fallimenti
              </Typography>
              <Typography variant="caption" color="error.main">
                {totalEvents > 0 ? ((failedEvents / totalEvents) * 100).toFixed(1) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {uniqueUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Utenti Attivi
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {criticalEvents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eventi Critici
              </Typography>
              {criticalEvents > 0 && (
                <WarningIcon color="warning" sx={{ mt: 1 }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Refresh"
                sx={{ mb: 1 }}
              />
              <IconButton onClick={loadAuditData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
              {loading && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} variant="scrollable">
          <Tab icon={<TimelineIcon />} label="Log Eventi" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<SecurityIcon />} label="Sicurezza" />
          <Tab icon={<SettingsIcon />} label="Configurazione" />
        </Tabs>

        {/* Events Log Tab */}
        <TabPanel value={currentTab} index={0}>
          {/* Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Cerca eventi"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filterCategory}
                label="Categoria"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">Tutte</MenuItem>
                {Object.entries(eventCategories).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Severità</InputLabel>
              <Select
                value={filterSeverity}
                label="Severità"
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <MenuItem value="">Tutte</MenuItem>
                <MenuItem value="LOW">Bassa</MenuItem>
                <MenuItem value="MEDIUM">Media</MenuItem>
                <MenuItem value="HIGH">Alta</MenuItem>
                <MenuItem value="CRITICAL">Critica</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Esporta
            </Button>
          </Box>

          {/* Events Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Evento</TableCell>
                  <TableCell>Utente</TableCell>
                  <TableCell>Risorsa</TableCell>
                  <TableCell>Severità</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((event) => {
                    const EventIcon = getEventIcon(event.category)
                    return (
                      <TableRow key={event.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(event.timestamp), 'dd/MM/yyyy', { locale: it })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(event.timestamp), 'HH:mm:ss', { locale: it })}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon 
                              sx={{ mr: 1, color: `${getEventColor(event.category)}.main` }} 
                              fontSize="small" 
                            />
                            <Typography variant="body2">
                              {eventCategories[event.category as keyof typeof eventCategories]?.label || event.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {event.details.action}
                          </Typography>
                          {event.details.resourceId && (
                            <Typography variant="caption" color="text.secondary">
                              {event.details.resourceId}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                              {event.user.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">
                                {event.user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {event.user.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {event.details.resource}
                          </Typography>
                          {event.department && (
                            <Typography variant="caption" color="text.secondary">
                              {event.department.name}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Chip 
                            label={event.severity}
                            color={severityColors[event.severity]}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            icon={event.details.success ? <SuccessIcon /> : <ErrorIcon />}
                            label={event.details.success ? 'Successo' : 'Fallito'}
                            color={event.details.success ? 'success' : 'error'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title="Visualizza dettagli">
                            <IconButton 
                              size="small"
                              onClick={() => alert('Dialog dettagli evento - Da implementare')}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredEvents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            labelRowsPerPage="Righe per pagina:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
            }
          />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <AuditCharts events={auditEvents} loading={loading} />
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    Eventi di Sicurezza Critici
                  </Typography>
                  <List>
                    {auditEvents
                      .filter(e => e.category === 'SECURITY_EVENTS' || e.severity === 'HIGH')
                      .slice(0, 5)
                      .map((event) => (
                        <ListItem key={event.id}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary={event.details.action}
                            secondary={`${event.details.ipAddress} - ${format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                  {auditEvents.filter(e => e.category === 'SECURITY_EVENTS').length === 0 && (
                    <Alert severity="success">
                      Nessun evento di sicurezza critico registrato
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monitoraggio IP
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Sistema di monitoraggio IP automatico - Richiede configurazione regole e soglie
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Configurazione da definire per:
                    - Soglie tentativi falliti
                    - IP whitelist/blacklist 
                    - Notifiche automatiche
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Configuration Tab */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Configurazione Sistema Audit
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Configurazioni del sistema audit - Da definire insieme alle policy aziendali
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Retention Policy
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Policy di mantenimento log secondo normative aerospaziali
                  </Typography>
                  <Button variant="outlined" size="small" disabled>
                    Configura
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categorie Eventi
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Configurazione categorie di eventi da tracciare
                  </Typography>
                  <Button variant="outlined" size="small" disabled>
                    Configura
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifiche
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Alerting automatico per eventi critici
                  </Typography>
                  <Button variant="outlined" size="small" disabled>
                    Configura
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  )
}