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
  Button,
  Chip,
  Tab,
  Tabs,
  Alert,
  IconButton,
} from '@mui/material'
import {
  Hexagon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Engineering,
  Schedule,
  CheckCircle,
  Warning,
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
      id={`honeycomb-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function HoneycombPage() {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState(0)
  
  const canManageProduction = ['ADMIN', 'SUPERVISOR'].includes(user?.role || '')

  // Mock data per demo
  const mockStats = {
    activeProcesses: 8,
    completedToday: 12,
    pendingQuality: 3,
    avgCycleTime: 45, // minuti
  }

  const mockProcesses = [
    {
      id: '1',
      odlNumber: 'ODL-HC001',
      partNumber: '8G5350HC001',
      coreType: 'ALUMINUM_3_16',
      status: 'IN_PROGRESS',
      operator: 'Mario Rossi',
      startedAt: '10:30',
      progress: 75,
    },
    {
      id: '2', 
      odlNumber: 'ODL-HC002',
      partNumber: '8G5350HC002',
      coreType: 'NOMEX_1_4',
      status: 'PENDING',
      operator: 'Luigi Verdi',
      estimatedStart: '14:00',
    },
  ]

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Hexagon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                Reparto Honeycomb
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Produzione strutture honeycomb composite
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <IconButton size="large" title="Aggiorna dati">
              <RefreshIcon />
            </IconButton>
            {canManageProduction && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="large"
              >
                Nuovo Processo
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Processi Attivi
                  </Typography>
                  <Typography variant="h4">
                    {mockStats.activeProcesses}
                  </Typography>
                </Box>
                <Engineering sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completati Oggi
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {mockStats.completedToday}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Controllo Qualità
                  </Typography>
                  <Typography variant="h4" color={mockStats.pendingQuality > 0 ? 'warning.main' : 'success.main'}>
                    {mockStats.pendingQuality}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: mockStats.pendingQuality > 0 ? 'warning.main' : 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tempo Ciclo Medio
                  </Typography>
                  <Typography variant="h4">
                    {mockStats.avgCycleTime}m
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Processi Attivi" />
          <Tab label="Configurazioni Parte" />
          <Tab label="Statistiche" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {mockProcesses.map((process) => (
              <Grid size={{ xs: 12, md: 6 }} key={process.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {process.odlNumber}
                      </Typography>
                      <Chip
                        label={process.status}
                        color={process.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Parte: {process.partNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Core: {process.coreType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Operatore: {process.operator}
                    </Typography>
                    {process.status === 'IN_PROGRESS' && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Avviato: {process.startedAt} - Progresso: {process.progress}%
                        </Typography>
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                          <Box 
                            sx={{ 
                              width: `${process.progress}%`, 
                              bgcolor: 'primary.main', 
                              height: '100%', 
                              borderRadius: 1 
                            }} 
                          />
                        </Box>
                      </Box>
                    )}
                    {process.status === 'PENDING' && (
                      <Typography variant="body2" color="text.secondary">
                        Inizio stimato: {process.estimatedStart}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Configurazioni Honeycomb - Integrazione Extension Tables
            </Typography>
            <Typography variant="body2">
              Questa sezione gestirà le configurazioni specifiche honeycomb per ogni parte:
            </Typography>
            <ul>
              <li><strong>Specifiche Core</strong>: Tipo, dimensioni celle, densità, spessore</li>
              <li><strong>Specifiche Skin</strong>: Materiale, spessore</li>
              <li><strong>Parametri Processo</strong>: Adesivo, temperatura, pressione, tempo</li>
              <li><strong>Controlli Qualità</strong>: Resistenza bond, compressione</li>
            </ul>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              ✅ Schema database implementato seguendo pattern Extension Tables
            </Typography>
          </Alert>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Alert severity="success">
            <Typography variant="h6" gutterBottom>
              Statistiche e Reporting - In Sviluppo
            </Typography>
            <Typography variant="body2">
              Dashboard analitiche per il reparto Honeycomb:
            </Typography>
            <ul>
              <li>Tempi ciclo per tipo core</li>
              <li>Efficienza operatori</li>
              <li>Analisi difetti e scarti</li>
              <li>Trend produttività</li>
              <li>Utilizzo attrezzature</li>
            </ul>
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  )
}