'use client'

import { useState, useEffect } from 'react'
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
import { UserRole, DepartmentRole } from '@prisma/client'
import { DepartmentAssignmentForm } from '@/components/molecules'

const userSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().nullable().optional(),
  departmentRole: z.nativeEnum(DepartmentRole).nullable().optional(),
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
}).refine((data) => {
  // Validate department assignment rules
  if (data.role === UserRole.ADMIN) {
    return !data.departmentId && !data.departmentRole
  }
  if (data.role === UserRole.OPERATOR) {
    return data.departmentId && data.departmentRole
  }
  return true
}, {
  message: "Configurazione ruoli non valida",
  path: ["role"],
})

const updateUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().nullable().optional(),
  departmentRole: z.nativeEnum(DepartmentRole).nullable().optional(),
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
}).refine((data) => {
  // Validate department assignment rules
  if (data.role === UserRole.ADMIN) {
    return !data.departmentId && !data.departmentRole
  }
  if (data.role === UserRole.OPERATOR) {
    return data.departmentId && data.departmentRole
  }
  return true
}, {
  message: "Configurazione ruoli non valida",
  path: ["role"],
})

// type UserFormData = z.infer<typeof userSchema>
// type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  departmentId: string | null
  departmentRole: DepartmentRole | null
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
  
  // State per la gestione dei reparti
  const [departmentId, setDepartmentId] = useState<string | null>(user?.departmentId || null)
  const [departmentRole, setDepartmentRole] = useState<DepartmentRole | null>(user?.departmentRole || null)
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || UserRole.OPERATOR)

  const isEditing = !!user

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || UserRole.OPERATOR,
      departmentId: user?.departmentId || null,
      departmentRole: user?.departmentRole || null,
      isActive: user?.isActive ?? true,
      password: '',
    },
  })

  // Watch del campo role per aggiornamenti in tempo reale
  const watchedRole = watch('role')
  
  // Aggiorna currentRole quando cambia il role nel form
  useEffect(() => {
    setCurrentRole(watchedRole)
  }, [watchedRole])

  const onSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditing ? `/api/admin/users/${user.id}` : '/api/admin/users'
      const method = isEditing ? 'PATCH' : 'POST'

      // Prepare payload with department data
      const payload = { 
        ...data,
        departmentId: departmentId || null,
        departmentRole: departmentRole || null,
      }
      
      // Don't send empty password for updates
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
              <InputLabel>Ruolo Sistema</InputLabel>
              <Select
                {...register('role')}
                label="Ruolo Sistema"
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

          {/* Assegnazione Reparto */}
          <Box>
            <DepartmentAssignmentForm
              userRole={currentRole}
              departmentId={departmentId}
              departmentRole={departmentRole}
              onDepartmentChange={(newDepartmentId) => {
                setDepartmentId(newDepartmentId)
                setValue('departmentId', newDepartmentId)
              }}
              onDepartmentRoleChange={(newDepartmentRole) => {
                setDepartmentRole(newDepartmentRole)
                setValue('departmentRole', newDepartmentRole)
              }}
              disabled={isSubmitting}
              error={!!errors.role || !!errors.departmentId || !!errors.departmentRole}
              helperText={errors.role?.message}
            />
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