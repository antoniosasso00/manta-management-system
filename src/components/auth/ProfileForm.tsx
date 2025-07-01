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
  Divider,
  Chip,
  Card,
  CardContent,
  Avatar
} from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'
// import { useAuth } from '@/hooks/useAuth' // Currently unused

const profileSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'ADMIN':
        return 'error'
      case 'SUPERVISOR':
        return 'warning'
      case 'OPERATOR':
        return 'primary'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'SUPERVISOR':
        return 'Supervisore'
      case 'OPERATOR':
        return 'Operatore'
      default:
        return 'Non definito'
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' })
        // Refresh the page to update the session
        window.location.reload()
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Errore durante l\'aggiornamento' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Errore di connessione' })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Box>
      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {user.name || 'Utente Senza Nome'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Chip 
                label={getRoleLabel(user.role)} 
                color={getRoleColor(user.role)}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Modifica Informazioni
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box>
          <Box>
            <TextField
              {...register('name')}
              label="Nome Completo"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={isSubmitting}
            />
          </Box>

          <Box>
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isSubmitting}
            />
          </Box>

          <Box>
            <Box sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ mr: 2 }}
              >
                {isSubmitting ? 'Salvando...' : 'Salva Modifiche'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.history.back()}
              >
                Annulla
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="body2" color="text.secondary">
        <strong>Nota:</strong> Le modifiche al ruolo possono essere effettuate solo da un amministratore.
        Per cambiare la password, utilizza la funzione dedicata nel menu account.
      </Typography>
    </Box>
  )
}