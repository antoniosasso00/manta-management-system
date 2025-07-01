'use client'

import { Container, Paper, Typography, Box, Chip, Grid, Card, CardContent } from '@mui/material'
import { CleaningServices, Timer, Group, Assessment } from '@mui/icons-material'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'

export default function CleanRoomPage() {
  return (
    <DashboardLayout 
      title="Clean Room - Laminazione" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Produzione', href: '/production' },
        { label: 'Clean Room' }
      ]}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR']} requiredDepartmentRoles={['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE']}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Status Overview */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CleaningServices sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Postazioni Attive
                    </Typography>
                    <Chip label="6/8" color="primary" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Timer sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Tempo Medio Ciclo
                    </Typography>
                    <Chip label="4.2h" color="success" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Group sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Operatori Turno
                    </Typography>
                    <Chip label="12" color="info" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Efficienza
                    </Typography>
                    <Chip label="87%" color="warning" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main Content */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Reparto Clean Room - Laminazione
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Controllo e monitoraggio del reparto di laminazione per componenti in fibra di carbonio.
                Gestione dei tempi di lavorazione, tracciamento QR e ottimizzazione flussi produttivi.
              </Typography>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Funzionalità Implementate:
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li" variant="body2" paragraph>
                        ✅ Controllo accessi basato su ruoli reparto
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        ✅ Navigazione dedicata per operatori
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        🚧 Scanner QR per entry/exit tracking
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        🚧 Dashboard tempo reale stato postazioni
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li" variant="body2" paragraph>
                        🔄 Monitoraggio tempi ciclo laminazione
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        🔄 Alert per ritardi e anomalie processo
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        🔄 Analytics prestazioni operatori
                      </Typography>
                      <Typography component="li" variant="body2" paragraph>
                        🔄 Integrazione sistema quality control
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Turni Information */}
              <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Organizzazione Turni
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="primary">
                      Turno Mattino (6:00-14:00)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      8 operatori - Focus su avvii produzione
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="secondary">
                      Turno Pomeriggio (14:00-22:00)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      6 operatori - Completamento cicli e setup
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        </RoleBasedAccess>
      </Container>
    </DashboardLayout>
  )
}