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
  TextField,
  Grid,
  Chip,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
} from '@mui/material'
import {
  Analytics as AnalyticsIcon,
  BugReport,
  Speed,
  Timeline,
  People,
  Schedule,
  TrendingUp,
  Error,
  Warning,
  Info,
  CheckCircle,
  Refresh,
  Download,
  Search,
  ExpandMore,
  Circle,
} from '@mui/icons-material'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resource: string
  ipAddress: string
  userAgent: string
  success: boolean
  details?: string
}

interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warning' | 'info'
  message: string
  module: string
  stackTrace?: string
  userId?: string
  count: number
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulazione dati mockati
      setTimeout(() => {
        setAuditLogs([
          {
            id: '1',
            timestamp: '2024-07-02 14:30:15',
            userId: 'admin123',
            userName: 'Admin Sistema',
            action: 'LOGIN',
            resource: '/admin/users',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            success: true
          },
          {
            id: '2',
            timestamp: '2024-07-02 14:25:42',
            userId: 'op001',
            userName: 'Giuseppe Verdi',
            action: 'CREATE_ODL',
            resource: '/api/odl',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Android 11)',
            success: true,
            details: 'Creato ODL #156 per Clean Room'
          },
          {
            id: '3',
            timestamp: '2024-07-02 14:20:12',
            userId: 'sup001',
            userName: 'Marco Rossi',
            action: 'UPDATE_USER',
            resource: '/api/admin/users/op002',
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
            success: false,
            details: 'Tentativo di modificare ruolo non autorizzato'
          },
          {
            id: '4',
            timestamp: '2024-07-02 14:15:33',
            userId: 'op002',
            userName: 'Sofia Neri',
            action: 'QR_SCAN',
            resource: '/api/production/events',
            ipAddress: '192.168.1.103',
            userAgent: 'Mobile App v1.0',
            success: true,
            details: 'Scansione QR ODL #155 - ENTRY Clean Room'
          },
          {
            id: '5',
            timestamp: '2024-07-02 14:10:55',
            userId: 'admin123',
            userName: 'Admin Sistema',
            action: 'BACKUP',
            resource: '/admin/backup',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            success: true,
            details: 'Backup automatico completato - 2.3 GB'
          }
        ])

        setErrorLogs([
          {
            id: '1',
            timestamp: '2024-07-02 14:28:30',
            level: 'error',
            message: 'Database connection timeout',
            module: 'DatabaseService',
            stackTrace: 'Error: Connection timeout\n  at DatabaseService.connect()\n  at async UserService.findById()',
            count: 3
          },
          {
            id: '2',
            timestamp: '2024-07-02 14:15:22',
            level: 'warning',
            message: 'Rate limit exceeded for API endpoint',
            module: 'RateLimitMiddleware',
            userId: 'op003',
            count: 15
          },
          {
            id: '3',
            timestamp: '2024-07-02 14:00:10',
            level: 'error',
            message: 'Failed to send notification email',
            module: 'EmailService',
            stackTrace: 'Error: SMTP connection failed\n  at EmailService.sendEmail()',
            count: 1
          },
          {
            id: '4',
            timestamp: '2024-07-02 13:45:33',
            level: 'info',
            message: 'Cache invalidated for user preferences',
            module: 'CacheService',
            count: 1
          },
          {
            id: '5',
            timestamp: '2024-07-02 13:30:15',
            level: 'warning',
            message: 'Slow query detected: getUsersWithDepartments (2.5s)',
            module: 'QueryMonitor',
            count: 8
          }
        ])

        setMetrics([
          {
            name: 'Response Time API',
            value: 245,
            unit: 'ms',
            status: 'good',
            trend: 'stable'
          },
          {
            name: 'CPU Usage',
            value: 68,
            unit: '%',
            status: 'warning',
            trend: 'up'
          },
          {
            name: 'Memory Usage',
            value: 4.2,
            unit: 'GB',
            status: 'good',
            trend: 'stable'
          },
          {
            name: 'Database Connections',
            value: 15,
            unit: 'active',
            status: 'good',
            trend: 'down'
          },
          {
            name: 'Requests/min',
            value: 142,
            unit: 'req',
            status: 'good',
            trend: 'up'
          },
          {
            name: 'Error Rate',
            value: 0.8,
            unit: '%',
            status: 'good',
            trend: 'stable'
          }
        ])

        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading monitoring data:', error)
      setLoading(false)
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="primary" />
      case 'down': return <TrendingUp style={{ transform: 'rotate(180deg)' }} color="primary" />
      case 'stable': return <Circle color="disabled" />
      default: return null
    }
  }

  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredErrorLogs = errorLogs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <AnalyticsIcon />
          Monitoring & Logs
        </Typography>
        <Box className="flex gap-2">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Ultima ora</MenuItem>
              <MenuItem value="24h">Ultime 24h</MenuItem>
              <MenuItem value="7d">Ultimi 7 giorni</MenuItem>
              <MenuItem value="30d">Ultimi 30 giorni</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Aggiorna
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Esporta
          </Button>
        </Box>
      </Box>

      {/* Performance Overview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Sistema - Tempo Reale
          </Typography>
          <Grid container spacing={3}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={metric.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {metric.name}
                        </Typography>
                        <Typography variant="h6">
                          {metric.value} {metric.unit}
                        </Typography>
                      </Box>
                      <Box className="text-right">
                        {getTrendIcon(metric.trend)}
                        <Chip
                          label={metric.status}
                          color={getStatusColor(metric.status)}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Cerca in logs e audit trail..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <Search color="action" sx={{ mr: 1 }} />
        }}
      />

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="Audit Logs" icon={<People />} iconPosition="start" />
            <Tab label="Error Tracking" icon={<BugReport />} iconPosition="start" />
            <Tab label="Performance" icon={<Speed />} iconPosition="start" />
            <Tab label="System Health" icon={<Timeline />} iconPosition="start" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {/* Tab 1: Audit Logs */}
            {activeTab === 0 && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Visualizzazione audit logs per il periodo: {timeRange}. Trovati {filteredAuditLogs.length} eventi.
                </Alert>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Utente</TableCell>
                        <TableCell>Azione</TableCell>
                        <TableCell>Risorsa</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Stato</TableCell>
                        <TableCell>Dettagli</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <LinearProgress />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAuditLogs.map((log) => (
                          <TableRow key={log.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {log.timestamp}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {log.userName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {log.userId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {log.resource}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {log.ipAddress}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {log.success ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Error color="error" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {log.details || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 2: Error Tracking */}
            {activeTab === 1 && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Monitoring errori di sistema. {filteredErrorLogs.filter(log => log.level === 'error').length} errori critici rilevati.
                </Alert>
                
                <Stack spacing={2}>
                  {loading ? (
                    <LinearProgress />
                  ) : (
                    filteredErrorLogs.map((log) => (
                      <Accordion key={log.id}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box className="flex items-center gap-2 w-full">
                            <Chip
                              label={log.level.toUpperCase()}
                              color={getLogLevelColor(log.level)}
                              size="small"
                            />
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {log.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.timestamp}
                            </Typography>
                            {log.count > 1 && (
                              <Chip
                                label={`${log.count}x`}
                                size="small"
                                color="warning"
                              />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Modulo
                              </Typography>
                              <Typography variant="body2" fontFamily="monospace">
                                {log.module}
                              </Typography>
                            </Grid>
                            {log.userId && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  User ID
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                  {log.userId}
                                </Typography>
                              </Grid>
                            )}
                            {log.stackTrace && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Stack Trace
                                </Typography>
                                <Box
                                  component="pre"
                                  sx={{
                                    backgroundColor: '#f5f5f5',
                                    p: 2,
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    overflow: 'auto'
                                  }}
                                >
                                  {log.stackTrace}
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Stack>
              </Box>
            )}

            {/* Tab 3: Performance Details */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        API Response Times
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="/api/auth/session"
                            secondary="Avg: 45ms, Max: 120ms"
                          />
                          <Chip label="FAST" color="success" size="small" />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="/api/production/events"
                            secondary="Avg: 180ms, Max: 450ms"
                          />
                          <Chip label="GOOD" color="success" size="small" />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="/api/admin/users"
                            secondary="Avg: 320ms, Max: 800ms"
                          />
                          <Chip label="SLOW" color="warning" size="small" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Database Performance
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Query Execution Time"
                            secondary="Avg: 25ms"
                          />
                          <Chip label="OPTIMAL" color="success" size="small" />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Connection Pool"
                            secondary="15/50 active"
                          />
                          <Chip label="HEALTHY" color="success" size="small" />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Cache Hit Rate"
                            secondary="94.2%"
                          />
                          <Chip label="EXCELLENT" color="success" size="small" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    Performance monitoring attivo. I dati vengono aggiornati ogni 30 secondi.
                  </Alert>
                </Grid>
              </Grid>
            )}

            {/* Tab 4: System Health */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Servizi Sistema
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Database PostgreSQL"
                            secondary="Online - 99.9% uptime"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Redis Cache"
                            secondary="Online - 245MB used"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Warning color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email Service"
                            secondary="Degraded - SMTP issues"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="File Storage"
                            secondary="Online - 15.2GB used"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Resource Usage
                      </Typography>
                      <Box className="space-y-3">
                        <Box>
                          <Box className="flex justify-between mb-1">
                            <Typography variant="body2">CPU Usage</Typography>
                            <Typography variant="body2">68%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={68} color="warning" />
                        </Box>
                        <Box>
                          <Box className="flex justify-between mb-1">
                            <Typography variant="body2">Memory Usage</Typography>
                            <Typography variant="body2">4.2GB / 8GB</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={52.5} color="primary" />
                        </Box>
                        <Box>
                          <Box className="flex justify-between mb-1">
                            <Typography variant="body2">Disk Usage</Typography>
                            <Typography variant="body2">15.2GB / 100GB</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={15.2} color="success" />
                        </Box>
                        <Box>
                          <Box className="flex justify-between mb-1">
                            <Typography variant="body2">Network I/O</Typography>
                            <Typography variant="body2">2.4 MB/s</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={35} color="info" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="success">
                    Tutti i servizi critici sono operativi. Sistema in stato di salute ottimale.
                  </Alert>
                </Grid>
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}