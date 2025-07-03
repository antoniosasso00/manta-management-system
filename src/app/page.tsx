import { Container, Typography, Box, Paper, Card, CardContent, Button, Grid } from '@mui/material'
import { 
  Dashboard,
  Factory,
  QrCodeScanner,
  Assignment,
  People,
  Settings,
  BarChart
} from '@mui/icons-material'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  const quickActions = [
    {
      title: 'Il Mio Reparto',
      description: 'Dashboard operatore con KPI e gestione ODL',
      icon: Dashboard,
      href: '/my-department',
      color: 'primary'
    },
    {
      title: 'Produzione Overview',
      description: 'Monitoraggio completo della produzione',
      icon: Factory,
      href: '/production',
      color: 'success'
    },
    {
      title: 'Scanner QR',
      description: 'Scansiona codici QR per tracciamento',
      icon: QrCodeScanner,
      href: '/qr-scanner',
      color: 'info'
    },
    {
      title: 'Gestione ODL',
      description: 'Visualizza e gestisci ordini di lavoro',
      icon: Assignment,
      href: '/production/odl',
      color: 'warning'
    }
  ]

  const adminActions = [
    {
      title: 'Gestione Utenti',
      description: 'Amministrazione utenti e ruoli',
      icon: People,
      href: '/admin/users',
      color: 'error'
    },
    {
      title: 'Monitoraggio',
      description: 'Audit e performance del sistema',
      icon: BarChart,
      href: '/admin/monitoring',
      color: 'secondary'
    },
    {
      title: 'Impostazioni',
      description: 'Configurazione sistema',
      icon: Settings,
      href: '/admin/settings',
      color: 'info'
    }
  ]

  const isAdmin = session?.user?.role === 'ADMIN'
  const displayActions = isAdmin ? [...quickActions, ...adminActions] : quickActions

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Welcome Card */}
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Benvenuto in Manta Group MES
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Ciao, {session?.user?.name || 'Utente'}! 
              Ruolo: <strong>{session?.user?.role}</strong>
            </Typography>
          </Paper>

          {/* Quick Actions */}
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Accesso Rapido
            </Typography>
            <Grid container spacing={3}>
              {displayActions.map((action, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <action.icon 
                          sx={{ 
                            mr: 2, 
                            color: `${action.color}.main`,
                            fontSize: 32
                          }} 
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                        {action.description}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color={action.color as any}
                        href={action.href}
                        fullWidth
                      >
                        Apri
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* System Status */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sistema Operativo
            </Typography>
            <Typography variant="body2" color="success.main" paragraph>
              ✅ Sistema MES attivo e funzionante
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Funzionalità disponibili:</strong> Autenticazione completa, QR Scanner, Dashboard operatore, Monitoraggio produzione, Gestione ODL
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Architettura:</strong> Next.js 15.3.4 + Material-UI v7 + PostgreSQL + Prisma ORM
            </Typography>
          </Paper>
        </Box>
    </Container>
  )
}