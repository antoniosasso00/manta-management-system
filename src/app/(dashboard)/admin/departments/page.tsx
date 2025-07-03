'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  Alert
} from '@mui/material'
import {
  Factory,
  Add,
  Edit,
  People,
  Assignment,
  TrendingUp,
  Delete,
  Upload,
  Download,
  Schedule,
  PersonAdd,
  Groups,
  Settings,
  AccessTime
} from '@mui/icons-material'
import { FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Tabs, Tab } from '@mui/material'

interface Department {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
  totalOperators: number
  activeODL: number
  averageProcessingTime: number
  efficiency: number
  shiftConfiguration?: ShiftConfig
  performanceMetrics?: PerformanceMetrics
}

interface ShiftConfig {
  shift1Start: string
  shift1End: string
  shift2Start: string
  shift2End: string
  hasThirdShift: boolean
  shift3Start?: string
  shift3End?: string
}

interface PerformanceMetrics {
  targetEfficiency: number
  targetCycleTime: number
  maxODLCapacity: number
  avgUtilizationRate: number
}

interface FormData {
  code: string
  name: string
  description: string
  isActive: boolean
  shiftConfiguration: ShiftConfig
  performanceMetrics: PerformanceMetrics
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignUsersDialogOpen, setAssignUsersDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    isActive: true,
    shiftConfiguration: {
      shift1Start: '06:00',
      shift1End: '14:00',
      shift2Start: '14:00',
      shift2End: '22:00',
      hasThirdShift: false,
    },
    performanceMetrics: {
      targetEfficiency: 85,
      targetCycleTime: 120,
      maxODLCapacity: 20,
      avgUtilizationRate: 0,
    },
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      } else {
        // Dati mock per sviluppo
        setDepartments([
          {
            id: '1',
            code: 'CLEAN',
            name: 'Clean Room',
            description: 'Reparto laminazione in camera bianca',
            isActive: true,
            totalOperators: 8,
            activeODL: 12,
            averageProcessingTime: 145,
            efficiency: 92,
            shiftConfiguration: {
              shift1Start: '06:00',
              shift1End: '14:00',
              shift2Start: '14:00',
              shift2End: '22:00',
              hasThirdShift: false,
            },
            performanceMetrics: {
              targetEfficiency: 90,
              targetCycleTime: 150,
              maxODLCapacity: 20,
              avgUtilizationRate: 85,
            }
          },
          {
            id: '2',
            code: 'AUTO',
            name: 'Autoclavi',
            description: 'Reparto cura in autoclave',
            isActive: true,
            totalOperators: 4,
            activeODL: 6,
            averageProcessingTime: 280,
            efficiency: 88
          },
          {
            id: '3',
            code: 'NDI',
            name: 'NDI',
            description: 'Controlli non distruttivi',
            isActive: true,
            totalOperators: 3,
            activeODL: 4,
            averageProcessingTime: 95,
            efficiency: 95
          },
          {
            id: '4',
            code: 'RIF',
            name: 'Rifilatura',
            description: 'Rifinitura e rifilatura',
            isActive: true,
            totalOperators: 5,
            activeODL: 8,
            averageProcessingTime: 65,
            efficiency: 90
          },
          {
            id: '5',
            code: 'QC',
            name: 'Quality Control',
            description: 'Controllo qualità finale',
            isActive: false,
            totalOperators: 2,
            activeODL: 0,
            averageProcessingTime: 0,
            efficiency: 0
          }
        ])
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error'
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'success'
    if (efficiency >= 80) return 'warning'
    return 'error'
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept)
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description,
      isActive: dept.isActive,
      shiftConfiguration: dept.shiftConfiguration || {
        shift1Start: '06:00',
        shift1End: '14:00',
        shift2Start: '14:00',
        shift2End: '22:00',
        hasThirdShift: false,
      },
      performanceMetrics: dept.performanceMetrics || {
        targetEfficiency: 85,
        targetCycleTime: 120,
        maxODLCapacity: 20,
        avgUtilizationRate: 0,
      },
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (dept: Department) => {
    setSelectedDepartment(dept)
    setDeleteDialogOpen(true)
  }

  const handleAssignUsers = (dept: Department) => {
    setSelectedDepartment(dept)
    setAssignUsersDialogOpen(true)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(departments, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `departments_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          
          // Send data to backend API
          fetch('/api/admin/departments/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departments: importedData })
          })
          .then(response => {
            if (response.ok) {
              alert('Import completato con successo!')
              // Reload departments data
              setRefreshKey(prev => prev + 1)
            } else {
              throw new Error('Import failed')
            }
          })
          .catch(() => {
            alert('Errore durante l\'import dei dati')
          })
        } catch (error) {
          alert('Errore durante la lettura del file')
        }
      }
      reader.readAsText(file)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true,
      shiftConfiguration: {
        shift1Start: '06:00',
        shift1End: '14:00',
        shift2Start: '14:00',
        shift2End: '22:00',
        hasThirdShift: false,
      },
      performanceMetrics: {
        targetEfficiency: 85,
        targetCycleTime: 120,
        maxODLCapacity: 20,
        avgUtilizationRate: 0,
      },
    })
    setSelectedDepartment(null)
  }

  if (loading) {
    return (
      <Box className="p-4">
        <Typography>Caricamento...</Typography>
      </Box>
    )
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Factory />
          Gestione Dipartimenti
        </Typography>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<Upload />}
            component="label"
          >
            Importa
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleImport}
            />
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Esporta
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nuovo Dipartimento
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Dipartimenti Attivi
                  </Typography>
                  <Typography variant="h4">
                    {departments.filter(d => d.isActive).length}
                  </Typography>
                </Box>
                <Factory color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Operatori Totali
                  </Typography>
                  <Typography variant="h4">
                    {departments.reduce((sum, d) => sum + d.totalOperators, 0)}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ODL Attivi
                  </Typography>
                  <Typography variant="h4">
                    {departments.reduce((sum, d) => sum + d.activeODL, 0)}
                  </Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Efficienza Media
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(departments.filter(d => d.isActive).reduce((sum, d) => sum + d.efficiency, 0) / departments.filter(d => d.isActive).length)}%
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Departments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Elenco Dipartimenti
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Codice</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Operatori</TableCell>
                  <TableCell>ODL Attivi</TableCell>
                  <TableCell>Tempo Medio</TableCell>
                  <TableCell>Efficienza</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {dept.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dept.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {dept.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dept.isActive ? 'Attivo' : 'Inattivo'}
                        color={getStatusColor(dept.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dept.totalOperators}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {dept.activeODL}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dept.averageProcessingTime > 0 ? formatTime(dept.averageProcessingTime) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {dept.efficiency > 0 ? (
                        <Chip
                          label={`${dept.efficiency}%`}
                          color={getEfficiencyColor(dept.efficiency)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box className="flex gap-1">
                        <Tooltip title="Modifica">
                          <IconButton 
                            size="small"
                            onClick={() => handleEdit(dept)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assegna Utenti">
                          <IconButton 
                            size="small"
                            onClick={() => handleAssignUsers(dept)}
                          >
                            <Groups />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton 
                            size="small"
                            onClick={() => handleDelete(dept)}
                            disabled={dept.activeODL > 0}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
          setActiveTab(0)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Modifica Dipartimento' : 'Nuovo Dipartimento'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 2 }}>
            <Tab label="Informazioni Base" />
            <Tab label="Configurazione Turni" />
            <Tab label="Metriche Performance" />
          </Tabs>

          {/* Tab 1: Informazioni Base */}
          {activeTab === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Codice"
                  placeholder="es. CLEAN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  placeholder="es. Clean Room"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione"
                  placeholder="Descrizione del dipartimento"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Dipartimento Attivo"
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Configurazione Turni */}
          {activeTab === 1 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Primo Turno
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Inizio"
                  type="time"
                  value={formData.shiftConfiguration.shift1Start}
                  onChange={(e) => setFormData({
                    ...formData,
                    shiftConfiguration: {
                      ...formData.shiftConfiguration,
                      shift1Start: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Fine"
                  type="time"
                  value={formData.shiftConfiguration.shift1End}
                  onChange={(e) => setFormData({
                    ...formData,
                    shiftConfiguration: {
                      ...formData.shiftConfiguration,
                      shift1End: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Secondo Turno
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Inizio"
                  type="time"
                  value={formData.shiftConfiguration.shift2Start}
                  onChange={(e) => setFormData({
                    ...formData,
                    shiftConfiguration: {
                      ...formData.shiftConfiguration,
                      shift2Start: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Fine"
                  type="time"
                  value={formData.shiftConfiguration.shift2End}
                  onChange={(e) => setFormData({
                    ...formData,
                    shiftConfiguration: {
                      ...formData.shiftConfiguration,
                      shift2End: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.shiftConfiguration.hasThirdShift}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftConfiguration: {
                          ...formData.shiftConfiguration,
                          hasThirdShift: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Abilita Terzo Turno"
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 3: Metriche Performance */}
          {activeTab === 2 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Efficienza (%)"
                  type="number"
                  value={formData.performanceMetrics.targetEfficiency}
                  onChange={(e) => setFormData({
                    ...formData,
                    performanceMetrics: {
                      ...formData.performanceMetrics,
                      targetEfficiency: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tempo Ciclo Target (min)"
                  type="number"
                  value={formData.performanceMetrics.targetCycleTime}
                  onChange={(e) => setFormData({
                    ...formData,
                    performanceMetrics: {
                      ...formData.performanceMetrics,
                      targetCycleTime: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacità Max ODL"
                  type="number"
                  value={formData.performanceMetrics.maxODLCapacity}
                  onChange={(e) => setFormData({
                    ...formData,
                    performanceMetrics: {
                      ...formData.performanceMetrics,
                      maxODLCapacity: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Le metriche di performance verranno utilizzate per il monitoraggio KPI e gli alert automatici.
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false)
            setEditDialogOpen(false)
            resetForm()
            setActiveTab(0)
          }}>
            Annulla
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              // In produzione, salverebbe i dati
              alert(editDialogOpen ? 'Dipartimento aggiornato!' : 'Dipartimento creato!')
              setCreateDialogOpen(false)
              setEditDialogOpen(false)
              resetForm()
              setActiveTab(0)
            }}
          >
            {editDialogOpen ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare il dipartimento <strong>{selectedDepartment?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              // In produzione, eliminerebbe il dipartimento
              alert(`Dipartimento ${selectedDepartment?.name} eliminato!`)
              setDeleteDialogOpen(false)
              setSelectedDepartment(null)
            }}
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog
        open={assignUsersDialogOpen}
        onClose={() => setAssignUsersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center gap-2">
            <Groups />
            Assegna Utenti a {selectedDepartment?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Seleziona gli utenti da assegnare al dipartimento. Gli utenti già assegnati ad altri dipartimenti verranno trasferiti.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Utenti disponibili:</strong> 12 operatori senza reparto
          </Alert>

          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Ruolo nel Dipartimento</InputLabel>
              <Select defaultValue="">
                <MenuItem value="OPERATORE">Operatore</MenuItem>
                <MenuItem value="CAPO_TURNO">Capo Turno</MenuItem>
                <MenuItem value="CAPO_REPARTO">Capo Reparto</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Opzioni Batch
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ mr: 1 }}
              onClick={() => alert('Selezionati tutti gli utenti senza reparto')}
            >
              Seleziona Non Assegnati
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => alert('Import CSV in sviluppo')}
            >
              Importa da CSV
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignUsersDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              alert(`Utenti assegnati a ${selectedDepartment?.name}!`)
              setAssignUsersDialogOpen(false)
            }}
          >
            Assegna Selezionati
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}