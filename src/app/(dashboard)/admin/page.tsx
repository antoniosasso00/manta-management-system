'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Divider
} from '@mui/material'
import {
  AdminPanelSettings,
  People,
  Factory,
  Analytics,
  Assignment,
  TrendingUp,
  Schedule,
  Security,
  Speed,
  Error,
  CheckCircle,
  Warning,
  Engineering,
  AccessTime
} from '@mui/icons-material'
import { 
  LinearProgress,
  Alert,
  Skeleton,
  Stack
} from '@mui/material'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalDepartments: number
  totalODL: number
  activeODL: number
  completedODL: number
  systemUptime: string
  lastBackup: string
  productionEfficiency: number
  avgCycleTime: number
  totalEvents: number
  errorRate: number
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    totalODL: 0,
    activeODL: 0,
    completedODL: 0,
    systemUptime: '',
    lastBackup: '',
    productionEfficiency: 0,
    avgCycleTime: 0,
    totalEvents: 0,
    errorRate: 0
  })
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Real-time notifications loading
  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // No fallback mock data - just keep empty array
    }
    
    setLastUpdate(new Date());
  }, [])

  useEffect(() => {
    loadAdminStats()
    loadNotifications()
    
    // Polling ogni 30 secondi per notifiche real-time
    const interval = setInterval(loadNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [loadNotifications])

  const loadAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.overview)
      } else {
        console.error('Error loading admin stats:', response.statusText)
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalDepartments: 0,
          totalODL: 0,
          activeODL: 0,
          completedODL: 0,
          systemUptime: 'N/A',
          lastBackup: 'N/A',
          todayEvents: 0,
          weeklyEvents: 0
        })
      }
    } catch (error) {
      console.error('Error loading admin stats:', error)
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalDepartments: 0,
        totalODL: 0,
        activeODL: 0,
        completedODL: 0,
        systemUptime: 'N/A',
        lastBackup: 'N/A',
        todayEvents: 0,
        weeklyEvents: 0
      })
    }
  }

  const adminModules = [
    {
      title: 'Gestione Utenti',
      description: 'Amministrazione utenti, ruoli e permessi',
      icon: People,
      href: '/dashboard/admin/users',
      color: '#2196f3',
      stats: `${stats.activeUsers}/${stats.totalUsers} attivi`
    },
    {
      title: 'Gestione Reparti',
      description: 'Configurazione reparti e struttura organizzativa',
      icon: Factory,
      href: '/dashboard/admin/departments',
      color: '#ff9800',
      stats: `${stats.totalDepartments} dipartimenti`
    },
    {
      title: 'Monitoring & Logs',
      description: 'Monitoraggio attività, audit logs e performance',
      icon: Analytics,
      href: '/dashboard/admin/monitoring',
      color: '#9c27b0',
      stats: `${stats.totalEvents} eventi`
    },
    {
      title: 'Impostazioni Sistema',
      description: 'Configurazione generale e integrazioni',
      icon: AdminPanelSettings,
      href: '/dashboard/admin/settings',
      color: '#607d8b',
      stats: 'Configurazione'
    }
  ]

  const systemInfo = [
    { label: 'ODL Totali', value: stats.totalODL || 0, icon: Assignment },
    { label: 'Eventi Oggi', value: stats.todayEvents || 0, icon: TrendingUp },
    { label: 'Eventi Settimana', value: stats.weeklyEvents || 0, icon: Schedule },
    { label: 'Sicurezza', value: 'Attiva', icon: Security }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <AdminPanelSettings />
          Pannello Amministrazione
        </Typography>
        <Chip 
          label="Sistema Operativo" 
          color="success" 
          variant="outlined"
        />
      </Box>

      {/* System Stats */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stato del Sistema
          </Typography>
          <Grid container spacing={3}>
            {systemInfo.map((info, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box className="flex items-center gap-2">
                  <info.icon color="primary" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {info.label}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {info.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Production KPIs */}
      <Box>
        <Typography variant="h6" gutterBottom>
          KPI Produzione Globale
        </Typography>
        <Grid container spacing={3}>
          {/* ODL Status Overview */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Assignment color="primary" />
                  <Chip label="ODL" size="small" />
                </Box>
                <Typography variant="h4">{stats.totalODL}</Typography>
                <Typography variant="body2" color="textSecondary">Totali</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip 
                    label={`${stats.activeODL} Attivi`} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`${stats.completedODL} Completati`} 
                    color="success" 
                    size="small" 
                    variant="outlined" 
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Production Efficiency */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Speed color="success" />
                  <Chip label="Efficienza" size="small" />
                </Box>
                <Typography variant="h4">{stats.productionEfficiency}%</Typography>
                <Typography variant="body2" color="textSecondary">Efficienza Produzione</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.productionEfficiency} 
                  color={stats.productionEfficiency > 80 ? "success" : "warning"}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Average Cycle Time */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <AccessTime color="info" />
                  <Chip label="Tempo Ciclo" size="small" />
                </Box>
                <Typography variant="h4">{stats.avgCycleTime}h</Typography>
                <Typography variant="body2" color="textSecondary">Tempo Medio Ciclo</Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Target: 4.0h
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Error Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Error color="error" />
                  <Chip label="Errori" size="small" />
                </Box>
                <Typography variant="h4">{(stats.errorRate * 100).toFixed(1)}%</Typography>
                <Typography variant="body2" color="textSecondary">Tasso di Errore</Typography>
                <Typography 
                  variant="caption" 
                  color={stats.errorRate < 0.05 ? "success.main" : "error.main"}
                  sx={{ mt: 1, display: 'block' }}
                >
                  {stats.errorRate < 0.05 ? '✓ Sotto soglia' : '⚠ Sopra soglia'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Admin Modules */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Moduli Amministrativi
        </Typography>
        <Grid container spacing={3}>
          {adminModules.map((module) => (
            <Grid item xs={12} sm={6} md={6} key={module.title}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea 
                  onClick={() => router.push(module.href)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent>
                    <Box className="flex items-start gap-3">
                      <module.icon 
                        sx={{ 
                          fontSize: 40, 
                          color: module.color,
                          mt: 0.5
                        }} 
                      />
                      <Box className="flex-1">
                        <Typography variant="h6" gutterBottom>
                          {module.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {module.description}
                        </Typography>
                        <Chip 
                          label={module.stats} 
                          size="small" 
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Real-time Notifications */}
      <Box>
        <Box className="flex items-center justify-between mb-3">
          <Typography variant="h6">
            Notifiche in Tempo Reale
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
        <Stack spacing={2}>
          {/* Notifiche dinamiche */}
          {notifications.map((notif) => (
            <Alert key={notif.id} severity={notif.type} icon={<People />}>
              <strong>{notif.title}:</strong> {notif.message}
            </Alert>
          ))}
          
          {/* Real-time notifications */}
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <Alert 
                key={notification.id || index} 
                severity={notification.type || 'info'}
                icon={notification.type === 'warning' ? <Warning /> : 
                      notification.type === 'error' ? <Error /> : 
                      notification.type === 'success' ? <CheckCircle /> : undefined}
              >
                <strong>{notification.title}:</strong> {notification.message}
              </Alert>
            ))
          ) : (
            <Alert severity="info">
              <strong>Sistema operativo:</strong> Nessuna notifica in questo momento
            </Alert>
          )}
        </Stack>
      </Box>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Azioni Rapide
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardActionArea onClick={() => router.push('/admin/users')}>
                  <CardContent className="text-center">
                    <People color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body1" fontWeight="medium">
                      Aggiungi Utente
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Crea nuovo account operatore
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardActionArea onClick={() => router.push('/admin/monitoring/audit')}>
                  <CardContent className="text-center">
                    <Analytics color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body1" fontWeight="medium">
                      Visualizza Audit Logs
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Monitora attività recenti
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardActionArea onClick={() => router.push('/admin/settings')}>
                  <CardContent className="text-center">
                    <Security color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body1" fontWeight="medium">
                      Configurazione Sistema
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Impostazioni e backup
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}