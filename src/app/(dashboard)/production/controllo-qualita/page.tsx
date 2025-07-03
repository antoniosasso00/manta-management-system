'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Badge,
  Alert,
} from '@mui/material'
import {
  VerifiedUser,
  Assignment,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'

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
      id={`quality-tabpanel-${index}`}
      aria-labelledby={`quality-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `quality-tab-${index}`,
    'aria-controls': `quality-tabpanel-${index}`,
  }
}

export default function ControlloQualitaPage() {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  // Mock data per il demo - in produzione verranno dai servizi API
  const mockStats = {
    totalInspections: 156,
    pendingInspections: 12,
    inProgressInspections: 8,
    completedToday: 15,
    passRate: 94.2,
    openNonConformities: 5,
    overdueActions: 2,
  }

  const mockRecentInspections = [
    {
      id: '1',
      odlNumber: 'ODL001',
      partNumber: '8G5350A001',
      inspectionType: 'DIMENSIONAL',
      status: 'COMPLETED',
      result: 'PASS',
      inspector: 'Mario Rossi',
      completedAt: '2024-01-10T14:30:00Z',
    },
    {
      id: '2',
      odlNumber: 'ODL002',
      partNumber: '8G5350B002',
      inspectionType: 'VISUAL',
      status: 'IN_PROGRESS',
      inspector: 'Luigi Verdi',
      startedAt: '2024-01-10T13:15:00Z',
    },
    {
      id: '3',
      odlNumber: 'ODL003',
      partNumber: '8G5350C003',
      inspectionType: 'FUNCTIONAL',
      status: 'PENDING',
      inspector: 'Anna Bianchi',
    },
  ]

  const mockNonConformities = [
    {
      id: '1',
      title: 'Difetto superficie',
      odlNumber: 'ODL005',
      severity: 'MAJOR',
      status: 'OPEN',
      assignedTo: 'Tech Lead',
      dueDate: '2024-01-15',
    },
    {
      id: '2',
      title: 'Dimensione fuori tolleranza',
      odlNumber: 'ODL008',
      severity: 'CRITICAL',
      status: 'IN_PROGRESS',
      assignedTo: 'Quality Manager',
      dueDate: '2024-01-12',
    },
  ]

  const canManageQuality = ['ADMIN', 'SUPERVISOR'].includes(user?.role || '')

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <VerifiedUser sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                Controllo Qualità
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestione ispezioni, non conformità e certificazioni
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <IconButton size="large" title="Aggiorna dati">
              <RefreshIcon />
            </IconButton>
            {canManageQuality && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="large"
              >
                Nuova Ispezione
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Ispezioni Totali
                  </Typography>
                  <Typography variant="h4">
                    {mockStats.totalInspections}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    In Attesa
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h4">
                      {mockStats.pendingInspections}
                    </Typography>
                    <Badge 
                      badgeContent={mockStats.inProgressInspections} 
                      color="warning"
                      sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ({mockStats.inProgressInspections} in corso)
                      </Typography>
                    </Badge>
                  </Box>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tasso Conformità
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {mockStats.passRate}%
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Non Conformità
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h4" color={mockStats.openNonConformities > 0 ? 'error.main' : 'success.main'}>
                      {mockStats.openNonConformities}
                    </Typography>
                    {mockStats.overdueActions > 0 && (
                      <Chip 
                        label={`${mockStats.overdueActions} scadute`}
                        size="small"
                        color="error"
                      />
                    )}
                  </Box>
                </Box>
                <Warning sx={{ fontSize: 40, color: mockStats.openNonConformities > 0 ? 'error.main' : 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="quality control tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dashboard" {...a11yProps(0)} />
          <Tab 
            label={
              <Badge badgeContent={mockStats.pendingInspections + mockStats.inProgressInspections} color="primary">
                Ispezioni
              </Badge>
            } 
            {...a11yProps(1)} 
          />
          <Tab 
            label={
              <Badge badgeContent={mockStats.openNonConformities} color="error">
                Non Conformità
              </Badge>
            } 
            {...a11yProps(2)} 
          />
          <Tab label="Piani di Controllo" {...a11yProps(3)} />
          <Tab label="Certificati" {...a11yProps(4)} />
        </Tabs>

        {/* Tab Panel 0: Dashboard */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Recent Inspections */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ispezioni Recenti
                  </Typography>
                  {mockRecentInspections.map((inspection) => (
                    <Box 
                      key={inspection.id}
                      sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        mb: 2,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {inspection.odlNumber} - {inspection.partNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {inspection.inspectionType} • Ispettore: {inspection.inspector}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {inspection.result && (
                            <Chip
                              label={inspection.result}
                              color={inspection.result === 'PASS' ? 'success' : 'error'}
                              size="small"
                            />
                          )}
                          <Chip
                            label={inspection.status}
                            color={
                              inspection.status === 'COMPLETED' ? 'success' :
                              inspection.status === 'IN_PROGRESS' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
                <CardActions>
                  <Button size="small">Vedi Tutte le Ispezioni</Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Azioni Rapide
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {canManageQuality && (
                      <>
                        <Button variant="outlined" fullWidth startIcon={<AddIcon />}>
                          Nuova Ispezione
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<AddIcon />}>
                          Nuovo Piano Controllo
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<Warning />}>
                          Segnala Non Conformità
                        </Button>
                      </>
                    )}
                    <Button variant="outlined" fullWidth startIcon={<CheckCircle />}>
                      Le Mie Ispezioni
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Non Conformità Aperte */}
              {mockStats.openNonConformities > 0 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error">
                      Non Conformità Aperte
                    </Typography>
                    {mockNonConformities.map((nc) => (
                      <Box 
                        key={nc.id}
                        sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: 'error.light', 
                          borderRadius: 1,
                          mb: 2,
                          bgcolor: 'error.50',
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {nc.title}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {nc.odlNumber} • Scadenza: {nc.dueDate}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            label={nc.severity}
                            color={nc.severity === 'CRITICAL' ? 'error' : 'warning'}
                            size="small"
                          />
                          <Chip
                            label={nc.status}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab Panel 1: Ispezioni */}
        <TabPanel value={currentTab} index={1}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Modulo Ispezioni - In Sviluppo
            </Typography>
            <Typography variant="body2">
              Qui verrà implementata la gestione completa delle ispezioni di qualità con:
            </Typography>
            <ul>
              <li>Lista ispezioni con filtri avanzati</li>
              <li>Workflow start/complete/sign</li>
              <li>Upload allegati e misurazioni</li>
              <li>Generazione certificati</li>
            </ul>
          </Alert>
        </TabPanel>

        {/* Tab Panel 2: Non Conformità */}
        <TabPanel value={currentTab} index={2}>
          <Alert severity="warning">
            <Typography variant="h6" gutterBottom>
              Modulo Non Conformità - In Sviluppo
            </Typography>
            <Typography variant="body2">
              Qui verrà implementata la gestione delle non conformità e azioni correttive (CAPA):
            </Typography>
            <ul>
              <li>Registrazione e classificazione NC</li>
              <li>Assegnazione e tracking azioni</li>
              <li>Analisi root cause</li>
              <li>Verifica efficacia</li>
            </ul>
          </Alert>
        </TabPanel>

        {/* Tab Panel 3: Piani di Controllo */}
        <TabPanel value={currentTab} index={3}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Modulo Piani di Controllo - In Sviluppo
            </Typography>
            <Typography variant="body2">
              Qui verrà implementata la gestione dei piani di controllo qualità:
            </Typography>
            <ul>
              <li>Definizione criteri di controllo</li>
              <li>Associazione a parti specifiche</li>
              <li>Versionamento e storico</li>
              <li>Template predefiniti</li>
            </ul>
          </Alert>
        </TabPanel>

        {/* Tab Panel 4: Certificati */}
        <TabPanel value={currentTab} index={4}>
          <Alert severity="success">
            <Typography variant="h6" gutterBottom>
              Modulo Certificati - In Sviluppo
            </Typography>
            <Typography variant="body2">
              Qui verrà implementata la gestione dei certificati di qualità:
            </Typography>
            <ul>
              <li>Generazione automatica certificati</li>
              <li>Firma digitale e approvazioni</li>
              <li>Template personalizzabili</li>
              <li>Export PDF e archiviazione</li>
            </ul>
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  )
}