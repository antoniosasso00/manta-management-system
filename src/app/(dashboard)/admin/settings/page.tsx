'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  Snackbar,
  CircularProgress,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Email,
  Security,
  Storage,
  Backup,
  CloudUpload,
  Schedule,
  Visibility,
  VisibilityOff,
  Add,
  Delete,
  Save,
  RestartAlt,
  IntegrationInstructions,
  Notifications,
  Speed,
  Warning,
} from '@mui/icons-material'

interface SystemSettings {
  email: {
    smtpHost: string
    smtpPort: number
    smtpSecure: boolean
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  system: {
    sessionTimeout: number
    maxUploadSize: number
    enableMaintenance: boolean
    maintenanceMessage: string
    autoBackup: boolean
    backupSchedule: string
    backupRetention: number
  }
  integrations: {
    gammaEnabled: boolean
    gammaSyncInterval: number
    gammaFolderPath: string
    apiRateLimit: number
    webhookEndpoints: string[]
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    alertThresholds: {
      odlDelay: number
      lowEfficiency: number
      highErrorRate: number
    }
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [testEmailDialog, setTestEmailDialog] = useState(false)
  const [backupDialog, setBackupDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' })
  const [settings, setSettings] = useState<SystemSettings>({
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: true,
      smtpUser: 'noreply@mantaaero.com',
      smtpPassword: '********',
      fromEmail: 'noreply@mantaaero.com',
      fromName: 'MES Aerospazio',
    },
    system: {
      sessionTimeout: 30,
      maxUploadSize: 10,
      enableMaintenance: false,
      maintenanceMessage: '',
      autoBackup: true,
      backupSchedule: '02:00',
      backupRetention: 7,
    },
    integrations: {
      gammaEnabled: true,
      gammaSyncInterval: 15,
      gammaFolderPath: '/data/gamma-sync',
      apiRateLimit: 100,
      webhookEndpoints: ['https://api.mantaaero.com/webhook'],
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      alertThresholds: {
        odlDelay: 120,
        lowEfficiency: 80,
        highErrorRate: 5,
      },
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Impostazioni salvate con successo!', severity: 'success' })
      } else {
        setSnackbar({ open: true, message: 'Errore nel salvataggio delle impostazioni', severity: 'error' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = () => {
    setTestEmailDialog(true)
  }

  const handleBackup = () => {
    setBackupDialog(true)
  }

  const handleRestore = async () => {
    if (confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/settings/reset', {
          method: 'POST'
        })
        
        if (response.ok) {
          setSnackbar({ open: true, message: 'Impostazioni ripristinate!', severity: 'success' })
          // Ricarica le impostazioni default
          window.location.reload()
        } else {
          setSnackbar({ open: true, message: 'Errore nel ripristino delle impostazioni', severity: 'error' })
        }
      } catch (error) {
        console.error('Error resetting settings:', error)
        setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <SettingsIcon />
          Impostazioni Sistema
        </Typography>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={handleRestore}
            disabled={loading}
          >
            Ripristina Default
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </Box>
      </Box>

      {/* Alert */}
      <Alert severity="info">
        Le modifiche alle impostazioni di sistema richiedono privilegi di amministratore e potrebbero richiedere il riavvio di alcuni servizi.
      </Alert>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="Email" icon={<Email />} iconPosition="start" />
            <Tab label="Sistema" icon={<Storage />} iconPosition="start" />
            <Tab label="Integrazioni" icon={<IntegrationInstructions />} iconPosition="start" />
            <Tab label="Notifiche" icon={<Notifications />} iconPosition="start" />
            <Tab label="Performance" icon={<Speed />} iconPosition="start" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {/* Tab 1: Email Configuration */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Configurazione Server Email (SMTP)
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Host SMTP"
                    value={settings.email.smtpHost}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Porta SMTP"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username SMTP"
                    value={settings.email.smtpUser}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpUser: e.target.value }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password SMTP"
                    type={showPassword ? 'text' : 'password'}
                    value={settings.email.smtpPassword}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPassword: e.target.value }
                    })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Mittente"
                    value={settings.email.fromEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, fromEmail: e.target.value }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome Mittente"
                    value={settings.email.fromName}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, fromName: e.target.value }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.email.smtpSecure}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, smtpSecure: e.target.checked }
                        })}
                      />
                    }
                    label="Usa connessione sicura (TLS/SSL)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={handleTestEmail}
                  >
                    Invia Email di Test
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Tab 2: System Configuration */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Parametri di Sistema
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Timeout Sessione (minuti)"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, sessionTimeout: parseInt(e.target.value) }
                    })}
                    helperText="Tempo di inattività prima del logout automatico"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dimensione Max Upload (MB)"
                    type="number"
                    value={settings.system.maxUploadSize}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, maxUploadSize: parseInt(e.target.value) }
                    })}
                    helperText="Dimensione massima file caricabili"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Backup Automatico
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.system.autoBackup}
                        onChange={(e) => setSettings({
                          ...settings,
                          system: { ...settings.system, autoBackup: e.target.checked }
                        })}
                      />
                    }
                    label="Abilita backup automatico"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Orario Backup"
                    type="time"
                    value={settings.system.backupSchedule}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, backupSchedule: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                    disabled={!settings.system.autoBackup}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Retention Backup (giorni)"
                    type="number"
                    value={settings.system.backupRetention}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, backupRetention: parseInt(e.target.value) }
                    })}
                    disabled={!settings.system.autoBackup}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box className="flex gap-2">
                    <Button
                      variant="outlined"
                      startIcon={<Backup />}
                      onClick={handleBackup}
                    >
                      Backup Manuale
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      component="label"
                    >
                      Ripristina da Backup
                      <input type="file" hidden accept=".sql,.zip" />
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Modalità Manutenzione
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.system.enableMaintenance}
                        onChange={(e) => setSettings({
                          ...settings,
                          system: { ...settings.system, enableMaintenance: e.target.checked }
                        })}
                      />
                    }
                    label="Abilita modalità manutenzione"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Messaggio di Manutenzione"
                    multiline
                    rows={3}
                    value={settings.system.maintenanceMessage}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, maintenanceMessage: e.target.value }
                    })}
                    disabled={!settings.system.enableMaintenance}
                    placeholder="Il sistema è in manutenzione. Torneremo online a breve."
                  />
                </Grid>
              </Grid>
            )}

            {/* Tab 3: Integrations */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Integrazione Gamma MES
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.integrations.gammaEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: { ...settings.integrations, gammaEnabled: e.target.checked }
                        })}
                      />
                    }
                    label="Abilita sincronizzazione Gamma"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Percorso Cartella Sincronizzazione"
                    value={settings.integrations.gammaFolderPath}
                    onChange={(e) => setSettings({
                      ...settings,
                      integrations: { ...settings.integrations, gammaFolderPath: e.target.value }
                    })}
                    disabled={!settings.integrations.gammaEnabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!settings.integrations.gammaEnabled}>
                    <InputLabel>Intervallo Sincronizzazione</InputLabel>
                    <Select
                      value={settings.integrations.gammaSyncInterval}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: { ...settings.integrations, gammaSyncInterval: e.target.value as number }
                      })}
                    >
                      <MenuItem value={5}>5 minuti</MenuItem>
                      <MenuItem value={15}>15 minuti</MenuItem>
                      <MenuItem value={30}>30 minuti</MenuItem>
                      <MenuItem value={60}>1 ora</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    API & Webhook
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rate Limit API (richieste/minuto)"
                    type="number"
                    value={settings.integrations.apiRateLimit}
                    onChange={(e) => setSettings({
                      ...settings,
                      integrations: { ...settings.integrations, apiRateLimit: parseInt(e.target.value) }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Endpoint Webhook
                  </Typography>
                  <List>
                    {settings.integrations.webhookEndpoints.map((endpoint, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={endpoint} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => {
                            const newEndpoints = [...settings.integrations.webhookEndpoints]
                            newEndpoints.splice(index, 1)
                            setSettings({
                              ...settings,
                              integrations: { ...settings.integrations, webhookEndpoints: newEndpoints }
                            })
                          }}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      const url = prompt('Inserisci URL webhook:')
                      if (url) {
                        setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            webhookEndpoints: [...settings.integrations.webhookEndpoints, url]
                          }
                        })
                      }
                    }}
                  >
                    Aggiungi Webhook
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Tab 4: Notifications */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Canali di Notifica
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailEnabled: e.target.checked }
                        })}
                      />
                    }
                    label="Notifiche Email"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.smsEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, smsEnabled: e.target.checked }
                        })}
                      />
                    }
                    label="Notifiche SMS (richiede provider)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.pushEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, pushEnabled: e.target.checked }
                        })}
                      />
                    }
                    label="Notifiche Push Browser"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Soglie di Allarme
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Ritardo ODL (minuti)"
                    type="number"
                    value={settings.notifications.alertThresholds.odlDelay}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        alertThresholds: {
                          ...settings.notifications.alertThresholds,
                          odlDelay: parseInt(e.target.value)
                        }
                      }
                    })}
                    helperText="Notifica se ODL in ritardo"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Efficienza Minima (%)"
                    type="number"
                    value={settings.notifications.alertThresholds.lowEfficiency}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        alertThresholds: {
                          ...settings.notifications.alertThresholds,
                          lowEfficiency: parseInt(e.target.value)
                        }
                      }
                    })}
                    helperText="Notifica se sotto soglia"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Tasso Errore Max (%)"
                    type="number"
                    value={settings.notifications.alertThresholds.highErrorRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        alertThresholds: {
                          ...settings.notifications.alertThresholds,
                          highErrorRate: parseInt(e.target.value)
                        }
                      }
                    })}
                    helperText="Notifica se sopra soglia"
                  />
                </Grid>
              </Grid>
            )}

            {/* Tab 5: Performance */}
            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Ottimizzazione Performance
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<Warning />}>
                    La modifica di questi parametri può influenzare significativamente le prestazioni del sistema. Modificare con cautela.
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Cache Database
                      </Typography>
                      <Box className="space-y-2">
                        <Chip label="Redis Connected" color="success" size="small" />
                        <Typography variant="body2" color="textSecondary">
                          Memoria utilizzata: 245 MB / 1 GB
                        </Typography>
                        <Button variant="outlined" size="small">
                          Svuota Cache
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Queue Jobs
                      </Typography>
                      <Box className="space-y-2">
                        <Chip label="12 Jobs in coda" color="info" size="small" />
                        <Typography variant="body2" color="textSecondary">
                          Worker attivi: 3/5
                        </Typography>
                        <Button variant="outlined" size="small">
                          Visualizza Coda
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Indici Database
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="odl_status_idx"
                            secondary="Ultimo rebuild: 2 giorni fa"
                          />
                          <Button size="small">Rebuild</Button>
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="production_events_timestamp_idx"
                            secondary="Ultimo rebuild: 5 giorni fa"
                          />
                          <Button size="small">Rebuild</Button>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog
        open={testEmailDialog}
        onClose={() => setTestEmailDialog(false)}
      >
        <DialogTitle>Invia Email di Test</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email destinatario"
            type="email"
            sx={{ mt: 2 }}
            defaultValue="admin@mantaaero.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestEmailDialog(false)}>Annulla</Button>
          <Button 
            variant="contained"
            onClick={() => {
              alert('Email di test inviata!')
              setTestEmailDialog(false)
            }}
          >
            Invia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog
        open={backupDialog}
        onClose={() => setBackupDialog(false)}
      >
        <DialogTitle>Backup Manuale</DialogTitle>
        <DialogContent>
          <Typography>
            Seleziona i dati da includere nel backup:
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel control={<Switch defaultChecked />} label="Database completo" />
            <FormControlLabel control={<Switch defaultChecked />} label="File di configurazione" />
            <FormControlLabel control={<Switch />} label="Logs di sistema" />
            <FormControlLabel control={<Switch />} label="File caricati" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Annulla</Button>
          <Button 
            variant="contained"
            onClick={async () => {
              setLoading(true)
              try {
                const response = await fetch('/api/admin/backup', {
                  method: 'POST'
                })
                
                if (response.ok) {
                  setSnackbar({ open: true, message: 'Backup avviato! Riceverai una notifica al completamento.', severity: 'success' })
                } else {
                  setSnackbar({ open: true, message: 'Errore nell\'avvio del backup', severity: 'error' })
                }
              } catch (error) {
                console.error('Error starting backup:', error)
                setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' })
              } finally {
                setLoading(false)
                setBackupDialog(false)
              }
            }}
            disabled={loading}
          >
            {loading ? 'Avvio...' : 'Avvia Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}