'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Box,
  Typography,
  Chip
} from '@mui/material'
import { Assignment, Schedule } from '@mui/icons-material'
import { useSession } from 'next-auth/react'

interface Department {
  id: string
  name: string
  type: string
  code: string
}

interface ODLData {
  id: string
  odlNumber: string
  status: string
  part: {
    partNumber: string
    description: string
  }
}

interface ODLManualAssignmentProps {
  open: boolean
  onClose: () => void
  odl: ODLData | null
  departments: Department[]
  onAssignmentComplete: () => void
}

export default function ODLManualAssignment({
  open,
  onClose,
  odl,
  departments,
  onAssignmentComplete
}: ODLManualAssignmentProps) {
  const { data: session } = useSession()
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canAssign = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERVISOR'

  const handleAssignment = async () => {
    if (!odl || !selectedDepartmentId) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/odl/${odl.id}/assign-department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departmentId: selectedDepartmentId,
          notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'assegnazione')
      }

      setSuccess('ODL assegnato con successo al reparto')
      onAssignmentComplete()
      
      // Chiudi dialog dopo 2 secondi
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Errore assegnazione:', error)
      setError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedDepartmentId('')
    setNotes('')
    setError(null)
    setSuccess(null)
    onClose()
  }

  const getStatusChipColor = (status: string) => {
    if (status === 'CREATED') return 'primary'
    if (status.includes('_COMPLETED')) return 'success'
    if (status.startsWith('IN_')) return 'warning'
    return 'default'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'CREATED': 'Creato',
      'IN_CLEANROOM': 'In Clean Room',
      'CLEANROOM_COMPLETED': 'Clean Room Completato',
      'IN_AUTOCLAVE': 'In Autoclave',
      'AUTOCLAVE_COMPLETED': 'Autoclave Completato',
      'IN_CONTROLLO_NUMERICO': 'In Controllo Numerico',
      'CONTROLLO_NUMERICO_COMPLETED': 'Controllo Numerico Completato',
      'IN_NDI': 'In NDI',
      'NDI_COMPLETED': 'NDI Completato',
      'IN_MONTAGGIO': 'In Montaggio',
      'MONTAGGIO_COMPLETED': 'Montaggio Completato',
      'IN_VERNICIATURA': 'In Verniciatura',
      'VERNICIATURA_COMPLETED': 'Verniciatura Completato',
      'IN_CONTROLLO_QUALITA': 'In Controllo Qualità',
      'COMPLETED': 'Completato'
    }
    return statusLabels[status] || status
  }

  if (!canAssign) {
    return null
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment />
          Assegnazione Manuale ODL
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {odl && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              {odl.odlNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Part: {odl.part.partNumber} - {odl.part.description}
            </Typography>
            <Box mt={1}>
              <Chip 
                label={getStatusLabel(odl.status)}
                color={getStatusChipColor(odl.status)}
                size="small"
              />
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          <FormControl fullWidth>
            <InputLabel>Reparto di Destinazione</InputLabel>
            <Select
              value={selectedDepartmentId}
              label="Reparto di Destinazione"
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              disabled={isLoading || Boolean(success)}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  <Box>
                    <Typography variant="body1">
                      {dept.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dept.code} - {dept.type}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Note (opzionali)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Aggiungi note per l'assegnazione manuale..."
            disabled={isLoading || Boolean(success)}
            fullWidth
          />

          <Alert severity="info" icon={<Schedule />}>
            <Typography variant="body2">
              L'ODL verrà automaticamente inserito nel reparto selezionato con un evento ENTRY. 
              Il cambio di stato avverrà immediatamente.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={isLoading}
        >
          Annulla
        </Button>
        <Button 
          onClick={handleAssignment}
          variant="contained"
          disabled={!selectedDepartmentId || isLoading || Boolean(success)}
          startIcon={<Assignment />}
        >
          {isLoading ? 'Assegnazione...' : 'Assegna ODL'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}