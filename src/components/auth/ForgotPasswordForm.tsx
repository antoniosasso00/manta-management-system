'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material'
import { Email as EmailIcon } from '@mui/icons-material'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante l\'invio della richiesta')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Box textAlign="center">
        <EmailIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Email Inviata!
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Se l&apos;email inserita è registrata nel sistema, riceverai le istruzioni per reimpostare la password.
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2">
            <strong>Non hai ricevuto l&apos;email?</strong><br />
            • Controlla la cartella spam<br />
            • Verifica di aver inserito l&apos;email corretta<br />
            • Contatta l&apos;amministratore se il problema persiste
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Richiedi Reset Password
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('email')}
          label="Indirizzo Email"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isSubmitting}
          placeholder="esempio@azienda.com"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {isSubmitting ? 'Invio in corso...' : 'Invia Email di Reset'}
        </Button>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Come funziona:</strong><br />
          1. Inserisci il tuo indirizzo email registrato<br />
          2. Riceverai un link per reimpostare la password<br />
          3. Il link sarà valido per 1 ora<br />
          4. Segui le istruzioni nell&apos;email per completare il reset
        </Typography>
      </Box>
    </Box>
  )
}