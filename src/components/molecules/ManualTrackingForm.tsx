'use client'

import { useState } from 'react'
import { 
  Box, 
  Typography, 
  TextField, 
  MenuItem,
  Stack,
  Alert
} from '@mui/material'
import { LoadingButton } from '@/components/atoms'
import { EventType } from '@prisma/client'
import { CreateManualEvent } from '@/domains/production'

interface ManualTrackingFormProps {
  odlId: string
  departmentId: string
  onSubmit: (data: CreateManualEvent) => Promise<void>
  onCancel?: () => void
}

export function ManualTrackingForm({ 
  odlId, 
  departmentId, 
  onSubmit,
  onCancel 
}: ManualTrackingFormProps) {
  const [eventType, setEventType] = useState<EventType>('ENTRY')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onSubmit({
        odlId,
        departmentId,
        eventType,
        notes: notes.trim() || undefined,
        confirmationRequired: true
      })
      
      // Reset form
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const eventTypeOptions = [
    { value: 'ENTRY', label: 'Ingresso' },
    { value: 'EXIT', label: 'Uscita' },
    { value: 'PAUSE', label: 'Pausa' },
    { value: 'RESUME', label: 'Ripresa' },
    { value: 'NOTE', label: 'Nota' },
  ]

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Typography variant="h6">
          Registra Evento Manuale
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          select
          fullWidth
          label="Tipo Evento"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          required
        >
          {eventTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Note (opzionale)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Aggiungi eventuali note o osservazioni..."
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <LoadingButton
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Annulla
            </LoadingButton>
          )}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
          >
            Registra Evento
          </LoadingButton>
        </Box>
      </Stack>
    </Box>
  )
}