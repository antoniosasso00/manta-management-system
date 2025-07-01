'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { UserRole } from '@prisma/client'

const userSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional().default(true),
  password: z.string().optional(),
}).refine((data) => {
  // Password is required for new users
  if (!data.password || data.password.length === 0) {
    return false
  }
  return data.password.length >= 8
}, {
  message: "La password deve contenere almeno 8 caratteri",
  path: ["password"],
})

const updateUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional().default(true),
  password: z.string().optional(),
}).refine((data) => {
  // Password is optional for existing users, but if provided must be valid
  if (data.password && data.password.length > 0) {
    return data.password.length >= 8
  }
  return true
}, {
  message: "La password deve contenere almeno 8 caratteri (lascia vuoto per mantenere quella attuale)",
  path: ["password"],
})

// type UserFormData = z.infer<typeof userSchema>
// type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
}

interface UserFormProps {
  user?: User | null
  onSave: () => void
  onCancel: () => void
}

export function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const isEditing = !!user

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || UserRole.OPERATOR,
      isActive: user?.isActive ?? true,
      password: '',
    },
  })

  const onSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditing ? `/api/admin/users/${user.id}` : '/api/admin/users'
      const method = isEditing ? 'PATCH' : 'POST'

      // Don't send empty password for updates
      const payload = { ...data }
      if (isEditing && !payload.password) {
        delete payload.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSave()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante il salvataggio')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Amministratore'
      case UserRole.SUPERVISOR:
        return 'Supervisore'
      case UserRole.OPERATOR:
        return 'Operatore'
      default:
        return role
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Ruolo</InputLabel>
              <Select
                {...register('role')}
                label="Ruolo"
                disabled={isSubmitting}
              >
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <TextField
              {...register('password')}
              label={isEditing ? 'Nuova Password (lascia vuoto per mantenere)' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  {...register('isActive')}
                  disabled={isSubmitting}
                />
              }
              label="Account Attivo"
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Aggiorna' : 'Crea')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}