'use client'

import { Container, Paper, Typography, Box, Grid, Card, CardContent, Chip } from '@mui/material'
import { Schedule, Assignment, TrendingUp, PieChart } from '@mui/icons-material'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'

export default function PlanningPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR']}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* KPI Overview */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Schedule sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      ODL Pianificati
                    </Typography>
                    <Chip label="45" color="primary" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Assegnazioni Auto
                    </Typography>
                    <Chip label="92%" color="success" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Efficienza Piano
                    </Typography>
                    <Chip label="87%" color="info" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PieChart sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Saturazione
                    </Typography>
                    <Chip label="78%" color="warning" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main Content */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Sistema di Pianificazione Automatica
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Modulo avanzato per la pianificazione automatica della produzione basato su algoritmi di ottimizzazione
                e machine learning per l&apos;assegnazione intelligente delle risorse.
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Algoritmi di Assegnazione ODL:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Skill Matrix Matching</strong> - Assegnazione basata su competenze operatori
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Workload Balancing</strong> - Bilanciamento carico di lavoro real-time
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Shift Optimization</strong> - Ottimizzazione turni e disponibilità
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Priority Scheduling</strong> - Gestione priorità e scadenze critiche
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Bottleneck Detection</strong> - Identificazione e risoluzione colli di bottiglia
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Machine Learning Features:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Performance Prediction</strong> - Stima tempi di completamento basata su storico
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Quality Forecasting</strong> - Previsione problemi qualità per operatore/turno
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Maintenance Scheduling</strong> - Pianificazione preventiva manutenzioni
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Capacity Planning</strong> - Analisi predittiva capacità produttiva
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      🔄 <strong>Demand Forecasting</strong> - Previsioni domanda e pianificazione strategica
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Implementation Architecture */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Architettura Microservizi
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Il sistema di pianificazione è implementato come microservizio Python separato per prestazioni ottimali
                degli algoritmi computazionalmente intensivi.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        ODL Assignment Engine
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Microservizio dedicato per l&apos;assegnazione automatica degli ODL agli operatori
                        basato su competenze, disponibilità e performance storica.
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip label="Python" size="small" color="primary" sx={{ mr: 1 }} />
                        <Chip label="ML" size="small" color="info" sx={{ mr: 1 }} />
                        <Chip label="REST API" size="small" color="secondary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="success">
                        Performance Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Servizio di analisi real-time delle metriche di performance e calcolo KPI
                        per dashboard manageriali e ottimizzazione continua.
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip label="Real-time" size="small" color="success" sx={{ mr: 1 }} />
                        <Chip label="Analytics" size="small" color="warning" sx={{ mr: 1 }} />
                        <Chip label="WebSocket" size="small" color="info" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="warning">
                        Forecasting Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sistema predittivo per la pianificazione a medio-lungo termine
                        e identificazione proattiva di criticità future.
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip label="Forecasting" size="small" color="warning" sx={{ mr: 1 }} />
                        <Chip label="Predictive" size="small" color="error" sx={{ mr: 1 }} />
                        <Chip label="Scheduling" size="small" color="primary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2" color="warning.contrastText">
                  ⚠️ <strong>Roadmap:</strong> I microservizi di pianificazione sono previsti per la fase post-MVP (settimana 9+).
                  Attualmente viene utilizzato un sistema di assegnazione semplificato integrato nel core Next.js.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </RoleBasedAccess>
      </Container>
  )
}