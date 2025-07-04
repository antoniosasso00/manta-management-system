'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Slider,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface UserSettings {
  profile: {
    name: string
    email: string
    phone: string
    language: string
    timezone: string
    avatar?: string
  }
  notifications: {
    emailODL: boolean
    emailAlarms: boolean
    emailReports: boolean
    pushBrowser: boolean
    digestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY'
    channels: string[]
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: number
    tableDensity: 'comfortable' | 'compact' | 'standard'
    keyboardShortcuts: boolean
  }
  gamma: {
    syncEnabled: boolean
    syncFrequency: number
    lastSync?: string
    mappings: Record<string, string>
    errorLogs: any[]
  }
  security: {
    showPasswordStrength: boolean
    sessionTimeout: number
    activeSessions: any[]
    loginHistory: any[]
    twoFactorEnabled: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarDialog, setAvatarDialog] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      language: 'it',
      timezone: 'Europe/Rome'
    },
    notifications: {
      emailODL: true,
      emailAlarms: true,
      emailReports: false,
      pushBrowser: true,
      digestFrequency: 'DAILY',
      channels: ['email', 'push']
    },
    ui: {
      theme: 'light',
      fontSize: 14,
      tableDensity: 'standard',
      keyboardShortcuts: true
    },
    gamma: {
      syncEnabled: true,
      syncFrequency: 60,
      mappings: {},
      errorLogs: []
    },
    security: {
      showPasswordStrength: true,
      sessionTimeout: 480,
      activeSessions: [],
      loginHistory: [],
      twoFactorEnabled: false
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/profile/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/auth/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Errore nel salvataggio delle impostazioni')
      }

      setSuccess('Impostazioni salvate con successo!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, avatar: e.target?.result as string }
        }))
        setAvatarDialog(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerGammaSync = async () => {
    try {
      const response = await fetch('/api/admin/sync/excel', { method: 'POST' })
      if (response.ok) {
        setSuccess('Sincronizzazione Gamma avviata!')
        loadSettings() // Refresh to show updated sync status
      } else {
        throw new Error('Errore nella sincronizzazione')
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  const updateProfile = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }))
  }

  const updateNotifications = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }))
  }

  const updateUI = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ui: { ...prev.ui, [field]: value }
    }))
  }

  const updateGamma = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      gamma: { ...prev.gamma, [field]: value }
    }))
  }

  const updateSecurity = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Impostazioni
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configura le preferenze del tuo account e del sistema
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<PersonIcon />} label="Profilo Utente" />
            <Tab icon={<NotificationsIcon />} label="Notifiche" />
            <Tab icon={<PaletteIcon />} label="Preferenze UI" />
            <Tab icon={<LinkIcon />} label="Integrazione Gamma" />
            <Tab icon={<SecurityIcon />} label="Sicurezza" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={settings.profile.avatar}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  >
                    {settings.profile.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom>
                    {settings.profile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {user?.role}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => setAvatarDialog(true)}
                    fullWidth
                  >
                    Cambia Foto
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informazioni Personali
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Nome completo"
                        fullWidth
                        value={settings.profile.name}
                        onChange={(e) => updateProfile('name', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Email"
                        fullWidth
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => updateProfile('email', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Telefono"
                        fullWidth
                        value={settings.profile.phone}
                        onChange={(e) => updateProfile('phone', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Lingua</InputLabel>
                        <Select
                          value={settings.profile.language}
                          label="Lingua"
                          onChange={(e) => updateProfile('language', e.target.value)}
                        >
                          <MenuItem value="it">Italiano</MenuItem>
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="fr">Français</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Fuso Orario</InputLabel>
                        <Select
                          value={settings.profile.timezone}
                          label="Fuso Orario"
                          onChange={(e) => updateProfile('timezone', e.target.value)}
                        >
                          <MenuItem value="Europe/Rome">Europe/Rome (CET)</MenuItem>
                          <MenuItem value="UTC">UTC</MenuItem>
                          <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifiche Email
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.emailODL}
                          onChange={(e) => updateNotifications('emailODL', e.target.checked)}
                        />
                      }
                      label="ODL creati/modificati"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.emailAlarms}
                          onChange={(e) => updateNotifications('emailAlarms', e.target.checked)}
                        />
                      }
                      label="Allarmi e ritardi"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.emailReports}
                          onChange={(e) => updateNotifications('emailReports', e.target.checked)}
                        />
                      }
                      label="Report giornalieri"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifiche Browser
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.pushBrowser}
                          onChange={(e) => updateNotifications('pushBrowser', e.target.checked)}
                        />
                      }
                      label="Notifiche push del browser"
                    />
                  </FormGroup>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Frequenza Digest
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={settings.notifications.digestFrequency}
                      onChange={(e) => updateNotifications('digestFrequency', e.target.value)}
                    >
                      <MenuItem value="IMMEDIATE">Immediato</MenuItem>
                      <MenuItem value="DAILY">Giornaliero</MenuItem>
                      <MenuItem value="WEEKLY">Settimanale</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* UI Preferences Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Aspetto
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <InputLabel>Tema</InputLabel>
                        <Select
                          value={settings.ui.theme}
                          label="Tema"
                          onChange={(e) => updateUI('theme', e.target.value)}
                        >
                          <MenuItem value="light">Chiaro</MenuItem>
                          <MenuItem value="dark">Scuro</MenuItem>
                          <MenuItem value="auto">Automatico (sistema)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Dimensione Font: {settings.ui.fontSize}px
                      </Typography>
                      <Slider
                        value={settings.ui.fontSize}
                        onChange={(_, value) => updateUI('fontSize', value)}
                        min={12}
                        max={18}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <InputLabel>Densità Tabelle</InputLabel>
                        <Select
                          value={settings.ui.tableDensity}
                          label="Densità Tabelle"
                          onChange={(e) => updateUI('tableDensity', e.target.value)}
                        >
                          <MenuItem value="comfortable">Comoda</MenuItem>
                          <MenuItem value="standard">Standard</MenuItem>
                          <MenuItem value="compact">Compatta</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Funzionalità
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.ui.keyboardShortcuts}
                          onChange={(e) => updateUI('keyboardShortcuts', e.target.checked)}
                        />
                      }
                      label="Scorciatoie da tastiera"
                    />
                  </FormGroup>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Anteprima Modifiche
                  </Typography>
                  <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: `${settings.ui.fontSize}px`,
                        fontFamily: 'monospace'
                      }}
                    >
                      Esempio di testo con font {settings.ui.fontSize}px
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Gamma Integration Tab */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configurazione Sync
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.gamma.syncEnabled}
                          onChange={(e) => updateGamma('syncEnabled', e.target.checked)}
                        />
                      }
                      label="Sincronizzazione automatica abilitata"
                    />
                  </FormGroup>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Frequenza Sync: {settings.gamma.syncFrequency} minuti
                    </Typography>
                    <Slider
                      value={settings.gamma.syncFrequency}
                      onChange={(_, value) => updateGamma('syncFrequency', value)}
                      min={15}
                      max={240}
                      step={15}
                      marks={[
                        { value: 15, label: '15m' },
                        { value: 60, label: '1h' },
                        { value: 120, label: '2h' },
                        { value: 240, label: '4h' }
                      ]}
                      valueLabelDisplay="auto"
                      disabled={!settings.gamma.syncEnabled}
                    />
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<SyncIcon />}
                      onClick={triggerGammaSync}
                      fullWidth
                    >
                      Avvia Sync Manuale
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stato Sincronizzazione
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Ultima sincronizzazione"
                        secondary={settings.gamma.lastSync ? 
                          format(new Date(settings.gamma.lastSync), 'dd/MM/yyyy HH:mm', { locale: it }) : 
                          'Mai eseguita'
                        }
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color={settings.gamma.errorLogs.length > 0 ? 'error' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Errori"
                        secondary={`${settings.gamma.errorLogs.length} errori negli ultimi 30 giorni`}
                      />
                    </ListItem>
                  </List>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Mapping Campi Personalizzati</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        Configura la mappatura tra i campi Gamma e i campi del sistema MES.
                        La configurazione avanzata richiede privilegi amministrativi.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Password e Accesso
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setPasswordDialog(true)}
                    sx={{ mb: 2 }}
                  >
                    Cambia Password
                  </Button>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.security.showPasswordStrength}
                          onChange={(e) => updateSecurity('showPasswordStrength', e.target.checked)}
                        />
                      }
                      label="Mostra indicatore forza password"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.security.twoFactorEnabled}
                          onChange={(e) => updateSecurity('twoFactorEnabled', e.target.checked)}
                        />
                      }
                      label="Autenticazione a due fattori (2FA)"
                      disabled
                    />
                  </FormGroup>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Timeout Sessione: {settings.security.sessionTimeout} minuti
                    </Typography>
                    <Slider
                      value={settings.security.sessionTimeout}
                      onChange={(_, value) => updateSecurity('sessionTimeout', value)}
                      min={60}
                      max={1440}
                      step={60}
                      marks={[
                        { value: 60, label: '1h' },
                        { value: 480, label: '8h' },
                        { value: 1440, label: '24h' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sessioni Attive
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Sessione corrente"
                        secondary="Questo dispositivo - Attiva ora"
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Privacy e Dati
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Scarica i Miei Dati (GDPR)
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                  >
                    Elimina Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={loadSettings}
          disabled={loading || saving}
        >
          Ripristina
        </Button>
        <Button
          variant="contained"
          onClick={saveSettings}
          disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          size="large"
        >
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </Box>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialog} onClose={() => setAvatarDialog(false)}>
        <DialogTitle>Cambia Foto Profilo</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatar-upload">
              <Button variant="contained" component="span" startIcon={<PhotoCameraIcon />}>
                Seleziona Immagine
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialog(false)}>Annulla</Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambia Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Password attuale"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nuova password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Conferma nuova password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Annulla</Button>
          <Button variant="contained">Cambia Password</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}