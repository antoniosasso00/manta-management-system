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
  Grid,
  Tooltip,
} from '@mui/material'
import {
  Factory,
  Edit,
  People,
  Assignment,
  TrendingUp,
  Download,
} from '@mui/icons-material'

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


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [departmentDetailsOpen, setDepartmentDetailsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadDepartments()
  }, [refreshKey])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      } else {
        console.error('Errore nel caricamento dipartimenti:', response.statusText)
        setDepartments([])
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

  const handleViewDetails = (dept: Department) => {
    setSelectedDepartment(dept)
    setDepartmentDetailsOpen(true)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(departments, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `departments_report_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
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
          Overview Dipartimenti
        </Typography>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Esporta Dati
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            Panoramica Dipartimenti
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
                  <TableCell>Dettagli</TableCell>
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
                        <Tooltip title="Visualizza Dettagli">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetails(dept)}
                          >
                            <Edit />
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

      {/* Department Details Dialog */}
      <Dialog 
        open={departmentDetailsOpen}
        onClose={() => {
          setDepartmentDetailsOpen(false)
          setSelectedDepartment(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center gap-2">
            <Factory />
            Dettagli Dipartimento - {selectedDepartment?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDepartment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Informazioni Base */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Informazioni Generali
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="textSecondary">
                          Codice
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedDepartment.code}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="textSecondary">
                          Nome
                        </Typography>
                        <Typography variant="body1">
                          {selectedDepartment.name}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="textSecondary">
                          Descrizione
                        </Typography>
                        <Typography variant="body1">
                          {selectedDepartment.description || 'Nessuna descrizione'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="textSecondary">
                          Stato
                        </Typography>
                        <Chip
                          label={selectedDepartment.isActive ? 'Attivo' : 'Inattivo'}
                          color={getStatusColor(selectedDepartment.isActive)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Metriche Performance */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Metriche Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Operatori
                        </Typography>
                        <Typography variant="h4">
                          {selectedDepartment.totalOperators}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          ODL Attivi
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {selectedDepartment.activeODL}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Tempo Medio
                        </Typography>
                        <Typography variant="h4">
                          {selectedDepartment.averageProcessingTime > 0 ? formatTime(selectedDepartment.averageProcessingTime) : '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Efficienza
                        </Typography>
                        <Typography variant="h4">
                          {selectedDepartment.efficiency > 0 ? (
                            <Chip
                              label={`${selectedDepartment.efficiency}%`}
                              color={getEfficiencyColor(selectedDepartment.efficiency)}
                              size="small"
                            />
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Configurazione Turni */}
              {selectedDepartment.shiftConfiguration && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Configurazione Turni
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Primo Turno
                          </Typography>
                          <Typography variant="body1">
                            {selectedDepartment.shiftConfiguration.shift1Start} - {selectedDepartment.shiftConfiguration.shift1End}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Secondo Turno
                          </Typography>
                          <Typography variant="body1">
                            {selectedDepartment.shiftConfiguration.shift2Start} - {selectedDepartment.shiftConfiguration.shift2End}
                          </Typography>
                        </Grid>
                        {selectedDepartment.shiftConfiguration.hasThirdShift && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Terzo Turno
                            </Typography>
                            <Typography variant="body1">
                              {selectedDepartment.shiftConfiguration.shift3Start} - {selectedDepartment.shiftConfiguration.shift3End}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Target Performance */}
              {selectedDepartment.performanceMetrics && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Target Performance
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="body2" color="textSecondary">
                            Target Efficienza
                          </Typography>
                          <Typography variant="h5">
                            {selectedDepartment.performanceMetrics.targetEfficiency}%
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="body2" color="textSecondary">
                            Tempo Ciclo Target
                          </Typography>
                          <Typography variant="h5">
                            {formatTime(selectedDepartment.performanceMetrics.targetCycleTime)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="body2" color="textSecondary">
                            Capacità Max ODL
                          </Typography>
                          <Typography variant="h5">
                            {selectedDepartment.performanceMetrics.maxODLCapacity}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="body2" color="textSecondary">
                            Utilizzo Medio
                          </Typography>
                          <Typography variant="h5">
                            {selectedDepartment.performanceMetrics.avgUtilizationRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDepartmentDetailsOpen(false)
            setSelectedDepartment(null)
          }}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}