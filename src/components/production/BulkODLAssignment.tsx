'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  PlaylistAdd,
  Clear,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material'
import { ODLStatus, Priority } from '@prisma/client'

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
}

interface Department {
  id: string
  name: string
  type: string
  code: string
}

interface BulkODLAssignmentProps {
  departments: Department[]
  onAssignmentComplete: (successCount: number, failedCount: number) => void
}

export default function BulkODLAssignment({
  departments,
  onAssignmentComplete
}: BulkODLAssignmentProps) {
  const [odls, setOdls] = useState<ODL[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedODLs, setSelectedODLs] = useState<Set<string>>(new Set())
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignmentProgress, setAssignmentProgress] = useState(0)

  // Filtri specifici per ODL CREATED
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    loadCreatedODLs()
  }, [])

  const loadCreatedODLs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/odl?status=CREATED&limit=200')
      if (response.ok) {
        const data = await response.json()
        setOdls(data.odls || [])
      }
    } catch (error) {
      console.error('Errore caricamento ODL CREATED:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOdls = odls.filter(odl => {
    const matchesSearch = !searchTerm || 
      odl.odlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      odl.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      odl.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPriority = !priorityFilter || odl.priority === priorityFilter
    
    return matchesSearch && matchesPriority
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedODLs(new Set(filteredOdls.map(odl => odl.id)))
    } else {
      setSelectedODLs(new Set())
    }
  }

  const handleSelectODL = (odlId: string, checked: boolean) => {
    const newSelected = new Set(selectedODLs)
    if (checked) {
      newSelected.add(odlId)
    } else {
      newSelected.delete(odlId)
    }
    setSelectedODLs(newSelected)
  }

  const handleBulkAssignment = async () => {
    if (selectedODLs.size === 0 || !selectedDepartment) return

    setIsAssigning(true)
    setAssignmentProgress(0)

    try {
      const response = await fetch('/api/odl/bulk/assign-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          odlIds: Array.from(selectedODLs),
          departmentId: selectedDepartment,
          notes: assignmentNotes || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        onAssignmentComplete(result.success || 0, result.failed || 0)
        
        // Reset form
        setSelectedODLs(new Set())
        setSelectedDepartment('')
        setAssignmentNotes('')
        
        // Reload ODL list
        await loadCreatedODLs()
      } else {
        throw new Error(result.error || 'Errore durante l\'assegnazione')
      }
    } catch (error) {
      console.error('Errore assegnazione bulk:', error)
    } finally {
      setIsAssigning(false)
      setAssignmentProgress(0)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'CREATED': 'Creato',
      'IN_CLEANROOM': 'In Clean Room',
      'CLEANROOM_COMPLETED': 'Clean Room Completato'
    }
    return statusLabels[status] || status
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 'error'
      case 'HIGH': return 'warning'
      case 'NORMAL': return 'info'
      case 'LOW': return 'default'
      default: return 'default'
    }
  }

  const allSelected = filteredOdls.length > 0 && selectedODLs.size === filteredOdls.length
  const someSelected = selectedODLs.size > 0 && selectedODLs.size < filteredOdls.length

  return (
    <Box>
      {/* Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PlaylistAdd color="primary" />
            <Typography variant="h6">
              Assegnazione Multipla ODL
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Seleziona uno o più ODL in stato "Creato" e assegnali simultaneamente a un reparto.
            Questa funzionalità permette di velocizzare l'avvio della produzione per batch di ODL.
          </Typography>
        </CardContent>
      </Card>

      {/* Filtri */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtri</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Cerca ODL, parte, descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          <TextField
            select
            label="Priorità"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tutte</MenuItem>
            <MenuItem value="URGENT">Urgente</MenuItem>
            <MenuItem value="HIGH">Alta</MenuItem>
            <MenuItem value="NORMAL">Normale</MenuItem>
            <MenuItem value="LOW">Bassa</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={() => {
              setSearchTerm('')
              setPriorityFilter('')
            }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* Selection Summary & Assignment Controls */}
      {selectedODLs.size > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
          <Typography variant="h6" sx={{ color: 'primary.contrastText', mb: 2 }}>
            {selectedODLs.size} ODL selezionati
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Reparto di Destinazione</InputLabel>
              <Select
                value={selectedDepartment}
                label="Reparto di Destinazione"
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={isAssigning}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Note (opzionali)"
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              disabled={isAssigning}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleBulkAssignment}
              disabled={!selectedDepartment || isAssigning}
              startIcon={<PlaylistAdd />}
            >
              Assegna {selectedODLs.size} ODL
            </Button>

            <Button
              variant="outlined"
              onClick={() => setSelectedODLs(new Set())}
              disabled={isAssigning}
              startIcon={<Clear />}
            >
              Deseleziona
            </Button>
          </Box>

          {isAssigning && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'primary.contrastText', mb: 1 }}>
                Assegnazione in corso...
              </Typography>
              <LinearProgress variant="indeterminate" sx={{ bgcolor: 'primary.dark' }} />
            </Box>
          )}
        </Paper>
      )}

      {/* ODL Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={filteredOdls.length === 0 || isAssigning}
                  />
                </TableCell>
                <TableCell>Numero ODL</TableCell>
                <TableCell>Part Number</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priorità</TableCell>
                <TableCell>Quantità</TableCell>
                <TableCell>Scadenza</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ p: 4 }}>
                      <LinearProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Caricamento ODL...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredOdls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ p: 4 }}>
                      <Info sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Nessun ODL in stato "Creato"
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tutti gli ODL sono già stati assegnati o sono in lavorazione
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOdls.map((odl) => (
                  <TableRow 
                    key={odl.id}
                    selected={selectedODLs.has(odl.id)}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedODLs.has(odl.id)}
                        onChange={(e) => handleSelectODL(odl.id, e.target.checked)}
                        disabled={isAssigning}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {odl.odlNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{odl.partNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {odl.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(odl.status)}
                        color="info"
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Stats */}
      {!loading && filteredOdls.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Totale: {filteredOdls.length} ODL • Selezionati: {selectedODLs.size} ODL
          </Typography>
        </Box>
      )}
    </Box>
  )
}