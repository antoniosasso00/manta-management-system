'use client'

import { Container, Paper, Typography, Box, Chip, Grid, Card, CardContent, LinearProgress } from '@mui/material'
import { LocalShipping, Science, Speed, TrendingUp } from '@mui/icons-material'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'

export default function AutoclavesPage() {
  const autoclaveData = [
    { id: 'AC-001', name: 'Autoclave 1', status: 'running', cycle: 'CUR-180-6H', progress: 65, remaining: '2h 15m' },
    { id: 'AC-002', name: 'Autoclave 2', status: 'loading', cycle: '-', progress: 0, remaining: '-' },
    { id: 'AC-003', name: 'Autoclave 3', status: 'running', cycle: 'CUR-120-4H', progress: 25, remaining: '3h 45m' },
    { id: 'AC-004', name: 'Autoclave 4', status: 'maintenance', cycle: '-', progress: 0, remaining: '-' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success'
      case 'loading': return 'warning'
      case 'maintenance': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running': return 'In Funzione'
      case 'loading': return 'Caricamento'
      case 'maintenance': return 'Manutenzione'
      default: return 'Sconosciuto'
    }
  }

  return (
    <DashboardLayout 
      title="Autoclavi - Polimerizzazione" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Produzione', href: '/production' },
        { label: 'Autoclavi' }
      ]}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR']} requiredDepartmentRoles={['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE']}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* KPI Overview */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <LocalShipping sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Autoclavi Attive
                    </Typography>
                    <Chip label="2/4" color="primary" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Science sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Cicli Attivi
                    </Typography>
                    <Chip label="2" color="info" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Utilizzo Medio
                    </Typography>
                    <Chip label="75%" color="success" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Efficienza
                    </Typography>
                    <Chip label="92%" color="warning" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Autoclavi Status */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Stato Autoclavi
              </Typography>
              <Grid container spacing={3}>
                {autoclaveData.map((autoclave) => (
                  <Grid size={{ xs: 12, md: 6 }} key={autoclave.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            {autoclave.name}
                          </Typography>
                          <Chip 
                            label={getStatusLabel(autoclave.status)} 
                            color={getStatusColor(autoclave.status)} 
                            size="small" 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          ID: {autoclave.id}
                        </Typography>
                        
                        {autoclave.cycle !== '-' && (
                          <>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Ciclo: <strong>{autoclave.cycle}</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Tempo rimanente: <strong>{autoclave.remaining}</strong>
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={autoclave.progress} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                              Progresso: {autoclave.progress}%
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Optimization Algorithm */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Algoritmo di Ottimizzazione
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Sistema di ottimizzazione automatica per il caricamento delle autoclavi basato su:
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Parametri di Ottimizzazione:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2" paragraph>
                      Dimensioni parti (2D bin packing)
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      Compatibilità cicli di cura
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      Priorità ODL e scadenze
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      Vincoli linee vuoto
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      Massimizzazione utilizzo spazio (85% target)
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Implementazione:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Python Microservice</strong> - Algoritmo First-Fit Decreasing
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Visualizzazione 2D</strong> - Layout autoclave ottimale
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Fallback Manuale</strong> - Override algoritmo se necessario
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Performance Target</strong> - {"<30s"} tempo ottimizzazione
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  💡 <strong>Nota:</strong> Il microservizio Python per l&apos;ottimizzazione è pianificato per la settimana 5-6 del roadmap MVP.
                  Attualmente viene utilizzato un algoritmo di assegnazione semplificato.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </RoleBasedAccess>
      </Container>
    </DashboardLayout>
  )
}