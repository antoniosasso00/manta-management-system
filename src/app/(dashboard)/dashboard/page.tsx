'use client'

import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Badge
} from '@mui/material'
import { 
  Dashboard,
  Factory,
  QrCodeScanner,
  Assignment,
  People,
  Settings,
  BarChart,
  PlaylistAdd,
  Print,
  TrendingUp,
  TrendingDown,
  AccessTime,
  Warning,
  CheckCircle,
  PendingActions
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardKPI } from '@/hooks/useRealTimeUpdates'
import Link from 'next/link'

interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  createdAt: Date;
  timestamp?: string;
  link: string;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { data: kpiData, loading, error, realTime } = useDashboardKPI()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Errore nel caricamento dei dati: {error}
        </Alert>
      </Container>
    )
  }

  const kpis = kpiData?.metrics || {
    odlInProgress: 0,
    completionRate: 0,
    avgTimePerDepartment: 0,
    activeAlerts: 0,
    todayProduction: 0
  }
  const notifications = kpiData?.notifications || []
  const recentActivity = kpiData?.recentActivity || []

  const quickActions = [
    {
      title: 'Nuovo ODL',
      description: 'Crea un nuovo ordine di lavoro',
      icon: PlaylistAdd,
      href: '/production/odl/create',
      color: 'primary',
      featured: true
    },
    {
      title: 'Scanner QR',
      description: 'Scansiona codici QR per tracciamento',
      icon: QrCodeScanner,
      href: '/qr-scanner',
      color: 'info',
      featured: false
    },
    {
      title: 'Stampa Etichette',
      description: 'Genera e stampa etichette QR',
      icon: Print,
      href: '/qr-labels',
      color: 'success',
      featured: false
    },
    {
      title: 'Il Mio Reparto',
      description: 'Dashboard operatore con KPI',
      icon: Dashboard,
      href: '/my-department',
      color: 'warning',
      featured: false
    }
  ]

  const adminActions = [
    {
      title: 'Gestione Utenti',
      description: 'Amministrazione utenti e ruoli',
      icon: People,
      href: '/admin/users',
      color: 'error',
      featured: false
    },
    {
      title: 'Monitoraggio',
      description: 'Audit e performance del sistema',
      icon: BarChart,
      href: '/admin/monitoring',
      color: 'secondary',
      featured: false
    },
    {
      title: 'Impostazioni',
      description: 'Configurazione sistema',
      icon: Settings,
      href: '/admin/settings',
      color: 'info',
      featured: false
    }
  ]

  const departmentLinks = [
    { name: 'Produzione', href: '/production', icon: Factory },
    { name: 'Parti', href: '/parts', icon: Assignment },
    { name: 'Pianificazione', href: '/planning', icon: AccessTime },
    { name: 'Report', href: '/reports', icon: BarChart }
  ]

  const displayActions = isAdmin ? [...quickActions, ...adminActions] : quickActions

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Welcome Header */}
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Benvenuto in Manta Aerospazio MES
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Ciao, {user?.name || 'Utente'}! 
                <Chip 
                  label={user?.role || 'GUEST'} 
                  size="small" 
                  sx={{ ml: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}
                />
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light', mx: 'auto', mb: 1 }}>
                <Factory sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Sistema MES Operativo
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* KPI Dashboard */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              KPI Dashboard
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {realTime.lastUpdate && (
                <Typography variant="caption" color="text.secondary">
                  Ultimo aggiornamento: {realTime.lastUpdate.toLocaleTimeString('it-IT')}
                </Typography>
              )}
              <Button
                size="small"
                onClick={realTime.toggle}
                color={realTime.isRunning ? 'error' : 'primary'}
                variant="outlined"
              >
                {realTime.isRunning ? 'Pausa Auto-refresh' : 'Avvia Auto-refresh'}
              </Button>
              <Button
                size="small"
                onClick={realTime.forceUpdate}
                variant="contained"
              >
                Aggiorna
              </Button>
            </Box>
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4">{kpis.odlInProgress}</Typography>
                      <Typography variant="body2">ODL in Lavorazione</Typography>
                    </Box>
                    <PendingActions sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4">{kpis.completionRate}%</Typography>
                      <Typography variant="body2">Completamento Giornaliero</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4">{kpis.avgTimePerDepartment}h</Typography>
                      <Typography variant="body2">Tempo Medio Reparto</Typography>
                    </Box>
                    <AccessTime sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: kpis.activeAlerts > 0 ? 'error.light' : 'info.light', color: kpis.activeAlerts > 0 ? 'error.contrastText' : 'info.contrastText' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4">{kpis.activeAlerts}</Typography>
                      <Typography variant="body2">Allarmi Attivi</Typography>
                    </Box>
                    {kpis.activeAlerts > 0 ? 
                      <Warning sx={{ fontSize: 40, opacity: 0.8 }} /> : 
                      <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Actions */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Azioni Rapide
          </Typography>
          <Grid container spacing={3}>
            {displayActions.map((action, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                <Card 
                  component={Link}
                  href={action.href}
                  elevation={action.featured ? 4 : 2}
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: action.featured ? `2px solid` : 'none',
                    borderColor: action.featured ? `${action.color}.main` : 'transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <action.icon 
                        sx={{ 
                          color: `${action.color}.main`,
                          fontSize: 40
                        }} 
                      />
                      {action.featured && (
                        <Chip 
                          label="Principale" 
                          size="small" 
                          color={action.color as any}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="h6" gutterBottom color="text.primary">
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                      {action.description}
                    </Typography>
                    <Button 
                      variant={action.featured ? "contained" : "outlined"}
                      color={action.color as any}
                      fullWidth
                      size="large"
                    >
                      {action.featured ? 'Inizia' : 'Apri'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Notifications & Department Links */}
        <Grid container spacing={3}>
          {/* Notifications */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notifiche Sistema
                <Badge badgeContent={notifications.length} color="primary" sx={{ ml: 2 }} />
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.map((notification: DashboardNotification) => (
                  <Alert 
                    key={notification.id}
                    severity={notification.type as any}
                    sx={{ mb: 2 }}
                    action={
                      <Typography variant="caption" color="text.secondary">
                        {notification.timestamp}
                      </Typography>
                    }
                  >
                    <Typography variant="subtitle2">{notification.title}</Typography>
                    <Typography variant="body2">{notification.message}</Typography>
                  </Alert>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Department Quick Links */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Accesso Reparti
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {departmentLinks.map((dept) => (
                  <Button
                    key={dept.name}
                    component={Link}
                    href={dept.href}
                    variant="outlined"
                    startIcon={<dept.icon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {dept.name}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* System Status */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Stato Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="success.main" paragraph>
                ✅ Sistema MES attivo e funzionante
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Ultime funzionalità:</strong> QR Scanner offline, Dashboard operatore completo, Workflow automatico tra reparti
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" paragraph>
                <strong>Architettura:</strong> Next.js 15.3.4 + Material-UI v7 + PostgreSQL + Prisma ORM
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Produzione ODL oggi:</strong> {kpis.todayProduction} completati
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  )
}