'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Fab,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material'
import {
  Engineering,
  Timeline,
  QrCode,
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Visibility,
  QrCodeScanner,
  Assignment,
  PlaylistAdd
} from '@mui/icons-material'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'
import { ODLStatus, Priority } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'
import ODLManualAssignment from '@/components/production/ODLManualAssignment'
import BulkODLAssignment from '@/components/production/BulkODLAssignment'

interface ODL {
  id: string
  odlNumber: string
  partNumber: string
  description: string
  status: ODLStatus
  priority: Priority
  quantity: number
  dueDate: string
  createdAt: string
  updatedAt: string
  part?: {
    id: string
    partNumber: string
    description: string
  }
}

interface ODLStats {
  total: number
  active: number
  inProduction: number
  waiting: number
  completed: number
}

export default function ODLPage() {
  const { user } = useAuth()
  const [odls, setOdls] = useState<ODL[]>([])
  const [stats, setStats] = useState<ODLStats>({ total: 0, active: 0, inProduction: 0, waiting: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; odl: ODL | null }>({ open: false, odl: null })
  const [assignmentDialog, setAssignmentDialog] = useState<{ open: boolean; odl: ODL | null }>({ open: false, odl: null })
  const [departments, setDepartments] = useState<any[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' })

  const filteredOdls = odls.filter(odl => {
    const matchesSearch = !searchTerm || 
      odl.odlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      odl.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      odl.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || odl.status === statusFilter
    const matchesPriority = !priorityFilter || odl.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  useEffect(() => {
    loadODLs()
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Errore caricamento reparti:', error)
    }
  }

  const loadODLs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/odl?limit=100')
      if (response.ok) {
        const data = await response.json()
        setOdls(data.odls || [])
        
        // Calcola statistiche
        const total = data.odls?.length || 0
        const active = data.odls?.filter((odl: ODL) => 
          ['IN_CLEANROOM', 'IN_AUTOCLAVE', 'IN_NDI'].includes(odl.status)
        ).length || 0
        const inProduction = data.odls?.filter((odl: ODL) => 
          ['IN_CLEANROOM', 'IN_AUTOCLAVE'].includes(odl.status)
        ).length || 0
        const waiting = data.odls?.filter((odl: ODL) => 
          ['CREATED', 'ON_HOLD'].includes(odl.status)
        ).length || 0
        const completed = data.odls?.filter((odl: ODL) => 
          odl.status === 'COMPLETED'
        ).length || 0
        
        setStats({ total, active, inProduction, waiting, completed })
      } else {
        throw new Error('Errore nel caricamento ODL')
      }
    } catch (error) {
      console.error('Error loading ODLs:', error)
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento degli ODL',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.odl) return

    try {
      const response = await fetch(`/api/odl/${deleteDialog.odl.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadODLs()
        setDeleteDialog({ open: false, odl: null })
        setSnackbar({
          open: true,
          message: 'ODL eliminato con successo',
          severity: 'success'
        })
      } else {
        throw new Error('Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting ODL:', error)
      setSnackbar({
        open: true,
        message: 'Errore nell\'eliminazione dell\'ODL',
        severity: 'error'
      })
    }
  }

  const getStatusColor = (status: ODLStatus) => {
    switch (status) {
      case 'IN_CLEANROOM':
      case 'IN_AUTOCLAVE':
      case 'IN_NDI':
      case 'CLEANROOM_COMPLETED':
      case 'AUTOCLAVE_COMPLETED':
        return 'success'
      case 'COMPLETED':
        return 'success'
      case 'ON_HOLD':
        return 'warning'
      case 'CREATED':
        return 'info'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 'error'
      case 'HIGH': return 'warning'
      case 'NORMAL': return 'info'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: ODLStatus) => {
    const labels: Record<ODLStatus, string> = {
      'CREATED': 'Creato',
      'IN_HONEYCOMB': 'In Honeycomb',
      'HONEYCOMB_COMPLETED': 'Honeycomb OK',
      'IN_CLEANROOM': 'In Clean Room',
      'CLEANROOM_COMPLETED': 'Clean Room OK',
      'IN_CONTROLLO_NUMERICO': 'In Controllo Numerico',
      'CONTROLLO_NUMERICO_COMPLETED': 'Controllo Numerico OK',
      'IN_MONTAGGIO': 'In Montaggio',
      'MONTAGGIO_COMPLETED': 'Montaggio OK',
      'IN_AUTOCLAVE': 'In Autoclavi',
      'AUTOCLAVE_COMPLETED': 'Autoclavi OK',
      'IN_NDI': 'In NDI',
      'NDI_COMPLETED': 'NDI OK',
      'IN_VERNICIATURA': 'In Verniciatura',
      'VERNICIATURA_COMPLETED': 'Verniciatura OK',
      'IN_MOTORI': 'In Motori',
      'MOTORI_COMPLETED': 'Motori OK',
      'IN_CONTROLLO_QUALITA': 'In Controllo Qualità',
      'CONTROLLO_QUALITA_COMPLETED': 'Controllo Qualità OK',
      'COMPLETED': 'Completato',
      'ON_HOLD': 'In Attesa',
      'CANCELLED': 'Annullato'
    }
    return labels[status] || status
  }

  const canEdit = user?.role && ['ADMIN', 'SUPERVISOR'].includes(user.role)
  const canDelete = user?.role === 'ADMIN'

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR', 'OPERATOR']}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header con azioni */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4">
                Gestione ODL
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScanner />}
                  href="/qr-scanner"
                >
                  Scanner QR
                </Button>
                <IconButton onClick={loadODLs}>
                  <Refresh />
                </IconButton>
              </Box>
            </Box>

            {/* Cards statistiche */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Engineering sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>ODL Totali</Typography>
                    <Chip label={stats.total} color="primary" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Timeline sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>In Produzione</Typography>
                    <Chip label={stats.inProduction} color="success" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <QrCode sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>Attivi</Typography>
                    <Chip label={stats.active} color="info" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <QrCode sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>In Attesa</Typography>
                    <Chip label={stats.waiting} color="warning" size="medium" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tab Navigation */}
            <Paper sx={{ mb: 3 }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="Gestione ODL" />
                <Tab label="Assegnazione Multipla" icon={<PlaylistAdd />} />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {tabValue === 0 && (
              <>
                {/* Filtri */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Filtri</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        placeholder="Cerca ODL, parte, descrizione..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Stato"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <MenuItem value="">Tutti gli stati</MenuItem>
                        <MenuItem value="CREATED">Creato</MenuItem>
                        <MenuItem value="IN_CLEANROOM">In Clean Room</MenuItem>
                        <MenuItem value="IN_AUTOCLAVE">In Autoclavi</MenuItem>
                        <MenuItem value="IN_NDI">In NDI</MenuItem>
                        <MenuItem value="COMPLETED">Completato</MenuItem>
                        <MenuItem value="ON_HOLD">In Attesa</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Priorità"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <MenuItem value="">Tutte le priorità</MenuItem>
                        <MenuItem value="URGENT">Urgente</MenuItem>
                        <MenuItem value="HIGH">Alta</MenuItem>
                        <MenuItem value="NORMAL">Normale</MenuItem>
                        <MenuItem value="LOW">Bassa</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}

            {/* Tabella ODL - Solo nel primo tab */}
            {tabValue === 0 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    ODL ({filteredOdls.length})
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      href="/production/odl/create"
                    >
                      Nuovo ODL
                    </Button>
                  )}
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ODL</TableCell>
                          <TableCell>Parte</TableCell>
                          <TableCell>Stato</TableCell>
                          <TableCell>Priorità</TableCell>
                          <TableCell>Quantità</TableCell>
                          <TableCell>Scadenza</TableCell>
                          <TableCell>Azioni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOdls.map((odl) => (
                          <TableRow key={odl.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {odl.odlNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {odl.partNumber}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {odl.description}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(odl.status)}
                                color={getStatusColor(odl.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={odl.priority}
                                color={getPriorityColor(odl.priority)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{odl.quantity}</TableCell>
                            <TableCell>
                              {odl.dueDate ? new Date(odl.dueDate).toLocaleDateString('it-IT') : '-'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" href={`/production/odl/${odl.id}`}>
                                  <Visibility />
                                </IconButton>
                                {canEdit && (
                                  <IconButton size="small" href={`/production/odl/${odl.id}/edit`}>
                                    <Edit />
                                  </IconButton>
                                )}
                                <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR']}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => setAssignmentDialog({ open: true, odl })}
                                    color="primary"
                                    title="Assegna manualmente a reparto"
                                  >
                                    <Assignment />
                                  </IconButton>
                                </RoleBasedAccess>
                                {canDelete && (
                                  <IconButton 
                                    size="small" 
                                    onClick={() => setDeleteDialog({ open: true, odl })}
                                    color="error"
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredOdls.length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="textSecondary">
                                Nessun ODL trovato
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {/* Bulk Assignment Tab */}
            {tabValue === 1 && (
              <RoleBasedAccess requiredRoles={['ADMIN', 'SUPERVISOR']}>
                <BulkODLAssignment
                  departments={departments}
                  onAssignmentComplete={(successCount, failedCount) => {
                    setSnackbar({
                      open: true,
                      message: `Assegnazione completata: ${successCount} ODL assegnati${failedCount > 0 ? `, ${failedCount} falliti` : ''}`,
                      severity: failedCount > 0 ? 'warning' : 'success'
                    })
                    loadODLs() // Reload per aggiornare stats
                  }}
                />
              </RoleBasedAccess>
            )}
          </Box>
        </RoleBasedAccess>

        {/* FAB per accesso rapido scanner */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          href="/qr-scanner"
        >
          <QrCodeScanner />
        </Fab>

        {/* Dialog conferma eliminazione */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, odl: null })}>
          <DialogTitle>Conferma Eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare l&apos;ODL {deleteDialog.odl?.odlNumber}?
              Questa azione non può essere annullata.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, odl: null })}>
              Annulla
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Elimina
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog assegnazione manuale ODL */}
        <ODLManualAssignment
          open={assignmentDialog.open}
          onClose={() => setAssignmentDialog({ open: false, odl: null })}
          odl={assignmentDialog.odl ? {
            id: assignmentDialog.odl.id,
            odlNumber: assignmentDialog.odl.odlNumber,
            status: assignmentDialog.odl.status,
            part: {
              partNumber: assignmentDialog.odl.partNumber,
              description: assignmentDialog.odl.description
            }
          } : null}
          departments={departments}
          onAssignmentComplete={() => {
            loadODLs()
            setSnackbar({
              open: true,
              message: 'ODL assegnato con successo al reparto',
              severity: 'success'
            })
          }}
        />

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
    </Container>
  )
}