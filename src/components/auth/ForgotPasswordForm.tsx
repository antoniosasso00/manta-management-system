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
  LinearProgress,
  Chip,
} from '@mui/material'
import { Email as EmailIcon } from '@mui/icons-material'

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido')
    .toLowerCase()
    .refine((email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(email)
    }, 'Formato email non valido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const watchedEmail = watch('email')

  const getDetailedErrorMessage = (error: string) => {
    switch (error) {
      case 'EmailNotFound':
        return {
          title: 'Email non trovata',
          message: 'Nessun account trovato con questo indirizzo email.',
          suggestions: [
            'Verifica di aver inserito l\'email corretta',
            'Contatta l\'amministratore se hai dimenticato l\'email',
            'Prova con un indirizzo email alternativo'
          ]
        }
      case 'TooManyRequests':
        return {
          title: 'Troppe richieste',
          message: 'Hai già richiesto un reset password di recente.',
          suggestions: [
            'Controlla la tua email per il link precedente',
            'Attendi qualche minuto prima di fare una nuova richiesta',
            'Verifica la cartella spam'
          ]
        }
      case 'EmailServiceError':
        return {
          title: 'Errore invio email',
          message: 'Impossibile inviare l\'email in questo momento.',
          suggestions: [
            'Riprova tra qualche minuto',
            'Contatta l\'amministratore se il problema persiste'
          ]
        }
      default:
        return {
          title: 'Errore',
          message: 'Si è verificato un errore durante la richiesta.',
          suggestions: [
            'Riprova tra qualche istante',
            'Controlla la tua connessione internet'
          ]
        }
    }
  }

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
        setError(errorData.error || errorData.message || 'Errore durante l\'invio della richiesta')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('NetworkError')
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

  const errorDetails = error ? getDetailedErrorMessage(error) : null

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Richiedi Reset Password
      </Typography>

      {/* Loading indicator */}
      {isSubmitting && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Detailed error messages */}
      {errorDetails && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {errorDetails.title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {errorDetails.message}
          </Typography>
          {errorDetails.suggestions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Suggerimenti:
              </Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <Typography variant="body2">{suggestion}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
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

        {/* Email validation feedback */}
        {watchedEmail && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Chip
              label={`Email: ${watchedEmail && !errors.email ? 'Valida' : 'Richiesta o non valida'}`}
              color={watchedEmail && !errors.email ? 'success' : 'default'}
              size="small"
            />
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting || !isValid}
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

      {/* Security notice */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Per motivi di sicurezza, riceverai sempre un messaggio di conferma, 
          anche se l&apos;email non è registrata nel sistema.
        </Typography>
      </Alert>
    </Box>
  )
}