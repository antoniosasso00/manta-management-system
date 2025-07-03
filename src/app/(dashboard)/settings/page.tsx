'use client'

import { useState } from 'react'
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
  LinearProgress,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Person as PersonIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { USER_ROLES } from '@/utils/constants'

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

interface BackupStatus {
  isRunning: boolean
  progress: number
  lastBackup?: Date
  error?: string
  success?: boolean
}

interface BackupSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  retentionDays: number
}

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    progress: 0,
    lastBackup: new Date('2024-01-15T10:30:00'),
  })
  const [backupSchedule, setBackupSchedule] = useState<BackupSchedule>({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
  })
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleExportDatabase = async () => {
    setBackupStatus({ isRunning: true, progress: 0 })
    setShowBackupDialog(true)
    
    try {
      // Simulate backup progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setBackupStatus(prev => ({ ...prev, progress: i }))
      }
      
      // TODO: Implement actual backup API call
      const response = await fetch('/api/admin/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mes-backup-${new Date().toISOString().split('T')[0]}.sql`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setBackupStatus({
          isRunning: false,
          progress: 100,
          lastBackup: new Date(),
          success: true,
        })
      } else {
        throw new Error('Backup failed')
      }
    } catch (error) {
      setBackupStatus({
        isRunning: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Errore durante il backup',
        success: false,
      })
    }
  }

  const handleRestoreDatabase = async () => {
    if (!selectedFile) return
    
    setBackupStatus({ isRunning: true, progress: 0 })
    
    try {
      const formData = new FormData()
      formData.append('backup', selectedFile)
      
      // TODO: Implement actual restore API call
      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        setBackupStatus({
          isRunning: false,
          progress: 100,
          success: true,
        })
        setShowRestoreDialog(false)
        setSelectedFile(null)
      } else {
        throw new Error('Restore failed')
      }
    } catch (error) {
      setBackupStatus({
        isRunning: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Errore durante il ripristino',
        success: false,
      })
    }
  }

  const tabs = [
    { label: 'Profilo', icon: <PersonIcon /> },
    ...(isAdmin ? [
      { label: 'Backup & Ripristino', icon: <BackupIcon /> },
      { label: 'Sincronizzazione', icon: <ScheduleIcon /> },
    ] : []),
  ]

  return (
    <DashboardLayout 
      title="Impostazioni"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Impostazioni' },
      ]}
    >
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      label={tab.label}
                      icon={tab.icon}
                      iconPosition="start"
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Tab Profilo */}
              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      Informazioni Personali
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nome: {user?.name || 'Non specificato'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {user?.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ruolo: {user?.role}
                      </Typography>
                      {user?.departmentRole && (
                        <Typography variant="body2" color="text.secondary">
                          Ruolo Reparto: {user.departmentRole}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      Preferenze
                    </Typography>
                    <Alert severity="info">
                      Le impostazioni di preferenza saranno implementate nelle prossime versioni.
                    </Alert>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Tab Backup & Ripristino - Solo Admin */}
              {isAdmin && (
                <TabPanel value={activeTab} index={1}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>
                        Backup e Ripristino Database
                      </Typography>
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>Attenzione:</strong> Queste operazioni possono richiedere diversi minuti e 
                        potrebbero influire sulle prestazioni del sistema.
                      </Alert>
                    </Grid>

                    {/* Backup Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <BackupIcon color="primary" />
                            <Typography variant="h6">Backup Database</Typography>
                          </Box>
                          
                          {backupStatus.lastBackup && (
                            <Box mb={2}>
                              <Typography variant="body2" color="text.secondary">
                                Ultimo backup: {backupStatus.lastBackup.toLocaleString('it-IT')}
                              </Typography>
                              <Chip
                                label="Completato"
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          )}
                          
                          {backupStatus.error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                              {backupStatus.error}
                            </Alert>
                          )}
                          
                          {backupStatus.success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                              Backup completato con successo!
                            </Alert>
                          )}
                          
                          <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportDatabase}
                            disabled={backupStatus.isRunning}
                            fullWidth
                          >
                            Esporta Database
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Restore */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <RestoreIcon color="secondary" />
                            <Typography variant="h6">Ripristino Database</Typography>
                          </Box>
                          
                          <Alert severity="error" sx={{ mb: 2 }}>
                            <strong>Pericolo:</strong> Questa operazione sovrascriverà tutti i dati esistenti!
                          </Alert>
                          
                          <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={() => setShowRestoreDialog(true)}
                            color="secondary"
                            fullWidth
                          >
                            Ripristina Database
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Backup Schedule */}
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <ScheduleIcon color="info" />
                            <Typography variant="h6">Backup Automatico</Typography>
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Stato: {backupSchedule.enabled ? 'Attivo' : 'Disattivo'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Frequenza: {backupSchedule.frequency}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Orario: {backupSchedule.time}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Retention: {backupSchedule.retentionDays} giorni
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Alert severity="info" sx={{ mt: 2 }}>
                            La configurazione del backup automatico sarà implementata nelle prossime versioni.
                          </Alert>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </TabPanel>
              )}

              {/* Tab Sincronizzazione - Solo Admin */}
              {isAdmin && (
                <TabPanel value={activeTab} index={2}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>
                        Sincronizzazione con Gamma MES
                      </Typography>
                      <Alert severity="info">
                        Le funzionalità di sincronizzazione con Gamma MES saranno implementate nelle prossime versioni.
                        Qui potrai configurare l'importazione automatica dei dati da file Excel/CSV.
                      </Alert>
                    </Grid>
                  </Grid>
                </TabPanel>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Dialog per Backup Progress */}
        <Dialog
          open={showBackupDialog}
          onClose={() => !backupStatus.isRunning && setShowBackupDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Backup in corso...</Typography>
              {!backupStatus.isRunning && (
                <IconButton onClick={() => setShowBackupDialog(false)}>
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={backupStatus.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {backupStatus.progress}% completato
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Dialog per Ripristino */}
        <Dialog
          open={showRestoreDialog}
          onClose={() => setShowRestoreDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon color="error" />
              <Typography variant="h6">Ripristino Database</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>ATTENZIONE:</strong> Questa operazione eliminerà tutti i dati esistenti 
              e li sostituirà con quelli del file di backup selezionato.
            </Alert>
            
            <input
              type="file"
              accept=".sql,.gz"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ marginBottom: '16px' }}
            />
            
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                File selezionato: {selectedFile.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRestoreDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleRestoreDatabase}
              color="error"
              variant="contained"
              disabled={!selectedFile || backupStatus.isRunning}
            >
              Ripristina
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  )
}