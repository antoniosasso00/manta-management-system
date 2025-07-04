'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Factory as FactoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { format, subDays, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface UserStats {
  odlCreated: number
  odlCompleted: number
  totalWorkingHours: number
  lastLoginDate: string
  averageSessionTime: number
  departmentRank: number
  completionRate: number
  perfectDays: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  department?: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editPhotoDialog, setEditPhotoDialog] = useState(false)
  const [editProfileDialog, setEditProfileDialog] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: '',
    bio: ''
  })

  // Mock stats - In produzione verrebbero da API
  const mockStats: UserStats = {
    odlCreated: 23,
    odlCompleted: 87,
    totalWorkingHours: 156.5,
    lastLoginDate: new Date().toISOString(),
    averageSessionTime: 4.2,
    departmentRank: 3,
    completionRate: 94.5,
    perfectDays: 12
  }

  // Mock activity - In produzione verrebbe da API
  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'ODL_CREATED',
      description: 'Creato ODL-2024-045 per parte 8G5350A0012',
      timestamp: new Date().toISOString(),
      department: 'Clean Room',
      status: 'success'
    },
    {
      id: '2',
      type: 'QR_SCAN',
      description: 'Scansione QR per ingresso Clean Room',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      department: 'Clean Room',
      status: 'info'
    },
    {
      id: '3',
      type: 'ODL_COMPLETED',
      description: 'Completato ODL-2024-042 in tempo record',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      department: 'Clean Room',
      status: 'success'
    },
    {
      id: '4',
      type: 'TIMER_WARNING',
      description: 'Superato tempo previsto per ODL-2024-041',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      department: 'Clean Room',
      status: 'warning'
    }
  ]

  const [stats] = useState<UserStats>(mockStats)
  const [recentActivities] = useState<RecentActivity[]>(mockActivities)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implementare upload foto quando sarà definito il sistema di storage
      alert('Upload foto - Da implementare con sistema storage')
      setEditPhotoDialog(false)
    }
  }

  const handleProfileUpdate = () => {
    // TODO: Implementare aggiornamento profilo quando sarà disponibile API
    alert('Aggiornamento profilo - Da implementare con API')
    setEditProfileDialog(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ODL_CREATED':
      case 'ODL_COMPLETED':
        return <AssignmentIcon />
      case 'QR_SCAN':
        return <VisibilityIcon />
      case 'TIMER_WARNING':
        return <WarningIcon />
      default:
        return <TimelineIcon />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'info'
    }
  }

  const memberSince = differenceInDays(new Date(), new Date('2023-01-15'))

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Il Mio Profilo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualizza e gestisci le informazioni del tuo account
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    fontSize: '3rem',
                    bgcolor: 'primary.main'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: -8,
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                  size="small"
                  onClick={() => setEditPhotoDialog(true)}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {user?.name}
              </Typography>
              
              <Chip 
                label={user?.role || 'OPERATOR'} 
                color="primary" 
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {user?.email}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditProfileDialog(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Modifica Profilo
              </Button>
              
              <Button
                variant="text"
                startIcon={<SettingsIcon />}
                component={Link}
                href="/settings"
                fullWidth
              >
                Impostazioni Account
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiche Rapide
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Membro da"
                    secondary={`${memberSince} giorni`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="ODL Completati"
                    secondary={stats.odlCompleted}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ore Lavorate"
                    secondary={`${stats.totalWorkingHours}h`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <StarIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Rank Reparto"
                    secondary={`#${stats.departmentRank}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Performance Overview */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {stats.odlCreated}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ODL Creati
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {stats.odlCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ODL Completati
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {stats.averageSessionTime}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Media Sessione
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.perfectDays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Giorni Perfetti
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Completion Rate */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Tasso di Completamento
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats.completionRate}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.completionRate} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              {/* Weekly Progress */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Progresso Settimanale
                  </Typography>
                  <Typography variant="body2" color="primary">
                    73%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={73} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Attività Recente
                </Typography>
                <Button 
                  size="small" 
                  component={Link} 
                  href="/my-department"
                >
                  Vedi Tutto
                </Button>
              </Box>
              
              <List>
                {recentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box sx={{ color: `${getActivityColor(activity.status)}.main` }}>
                          {getActivityIcon(activity.type)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}
                            </Typography>
                            {activity.department && (
                              <>
                                {' • '}
                                <Typography variant="caption" color="primary">
                                  {activity.department}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                      <Chip 
                        label={activity.status === 'success' ? 'Completato' : 
                               activity.status === 'warning' ? 'Attenzione' : 
                               activity.status === 'error' ? 'Errore' : 'Info'}
                        color={getActivityColor(activity.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Photo Dialog */}
      <Dialog open={editPhotoDialog} onClose={() => setEditPhotoDialog(false)}>
        <DialogTitle>Cambia Foto Profilo</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload">
              <Button variant="contained" component="span" startIcon={<PhotoCameraIcon />}>
                Seleziona Immagine
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
              Formati supportati: JPG, PNG. Dimensione massima: 5MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPhotoDialog(false)}>Annulla</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onClose={() => setEditProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Profilo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nome completo"
                fullWidth
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Telefono"
                fullWidth
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Bio"
                multiline
                rows={3}
                fullWidth
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Scrivi qualcosa su di te..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialog(false)}>Annulla</Button>
          <Button onClick={handleProfileUpdate} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}