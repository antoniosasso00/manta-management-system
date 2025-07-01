'use client'

import { Container, Paper, Typography, Box, Chip } from '@mui/material'
import { Engineering, Timeline, QrCode } from '@mui/icons-material'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'

export default function ODLPage() {
  return (
    <DashboardLayout 
      title="Gestione ODL" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Produzione', href: '/production' },
        { label: 'ODL' }
      ]}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR', 'OPERATOR']}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Status Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Engineering sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  ODL Attivi
                </Typography>
                <Chip label="12" color="primary" size="medium" />
              </Paper>
              
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  In Produzione
                </Typography>
                <Chip label="8" color="success" size="medium" />
              </Paper>
              
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <QrCode sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  In Attesa
                </Typography>
                <Chip label="4" color="warning" size="medium" />
              </Paper>
            </Box>

            {/* Main Content */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Ordini di Lavoro (ODL)
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Gestione completa degli Ordini di Lavoro per la produzione di componenti aerospaziali.
                Tracciamento attraverso i reparti: Clean Room, Autoclavi, NDI, Rifilatura.
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Funzionalità in Sviluppo:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Creazione e modifica ODL con validazione dati
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Assegnazione automatica a reparti e operatori
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Tracking real-time attraverso QR code scanning
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Dashboard di monitoraggio produzione
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Integrazione con sistema Gamma MES
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </RoleBasedAccess>
      </Container>
    </DashboardLayout>
  )
}