import { Container, Typography, Box, Paper, Card, CardContent } from '@mui/material'
import { 
  CheckCircle as CheckIcon, 
  Warning as WarningIcon,
  Security as SecurityIcon,
  Storage as DatabaseIcon,
  QrCode as QrCodeIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  const systemStatus = [
    { name: 'Autenticazione Completa', status: 'success', icon: SecurityIcon, description: 'Login, registrazione, reset password, gestione ruoli' },
    { name: 'Database Schema', status: 'warning', icon: DatabaseIcon, description: 'Esegui: docker-compose up -d && npx prisma db push' },
    { name: 'QR Code Scanner', status: 'success', icon: QrCodeIcon, description: 'Pronto per scansione (@zxing/browser)' },
    { name: 'Material UI v7', status: 'success', icon: PaletteIcon, description: 'Tema configurato con dark mode' },
  ]

  return (
    <DashboardLayout title="Dashboard">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Welcome Card */}
          <Box>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h4" component="h2" gutterBottom>
                Benvenuto in Manta Group MES
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Ciao, {session?.user?.name || 'Utente'}! 
                Ruolo: <strong>{session?.user?.role}</strong>
              </Typography>
            </Paper>
          </Box>

          {/* System Status */}
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Stato del Sistema
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
              {systemStatus.map((item, index) => (
                <Box key={index}>
                  <Card elevation={2} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <item.icon 
                          sx={{ 
                            mr: 2, 
                            color: item.status === 'success' ? 'success.main' : 'warning.main' 
                          }} 
                        />
                        {item.status === 'success' ? (
                          <CheckIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Quick Actions and System Architecture */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
            {/* Quick Actions */}
            <Box>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Prossimi Passi
                </Typography>
                <Box component="ol" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Avvia database: <code>docker-compose up -d</code>
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Setup database: <code>npx prisma db push</code>
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Crea reparti e ODL di test
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Implementa moduli Clean Room e Autoclavi
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Configura microservizi Python per ottimizzazione
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {/* System Architecture */}
            <Box>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Architettura Sistema
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Frontend:</strong> Next.js 15.3.4 + Material-UI v7
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Backend:</strong> Next.js API Routes + Python Microservizi
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Database:</strong> PostgreSQL + Prisma ORM
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Auth:</strong> NextAuth.js v5 con JWT e ruoli
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Sicurezza:</strong> Rate limiting, timeout sessioni, validazione Zod
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Container>
    </DashboardLayout>
  )
}