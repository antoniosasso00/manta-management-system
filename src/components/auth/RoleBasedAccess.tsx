'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Box, Typography, Paper, Alert } from '@mui/material'
import { Lock } from '@mui/icons-material'

interface RoleBasedAccessProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredDepartmentRoles?: string[]
  departmentId?: string
  fallback?: ReactNode
  showFallback?: boolean
}

export function RoleBasedAccess({
  children,
  requiredRoles = [],
  requiredDepartmentRoles = [],
  departmentId,
  fallback,
  showFallback = true,
}: RoleBasedAccessProps) {
  const { user, isAuthenticated } = useAuth()

  // Se non autenticato, non mostrare nulla
  if (!isAuthenticated || !user) {
    return null
  }

  // Controlla ruolo sistema
  const hasSystemRole = requiredRoles.length === 0 || requiredRoles.includes(user.role)
  
  // Controlla ruolo reparto - ADMIN bypassa i controlli di reparto
  const hasDepartmentRole = requiredDepartmentRoles.length === 0 || 
    user.role === 'ADMIN' ||
    (user.departmentRole && requiredDepartmentRoles.includes(user.departmentRole))
  
  // Controlla reparto specifico - ADMIN bypassa il controllo reparto
  const hasCorrectDepartment = !departmentId || user.role === 'ADMIN' || user.departmentId === departmentId

  // Se ha tutti i permessi necessari, mostra il contenuto
  if (hasSystemRole && hasDepartmentRole && hasCorrectDepartment) {
    return <>{children}</>
  }

  // Se è specificato un fallback personalizzato, usalo
  if (fallback) {
    return <>{fallback}</>
  }

  // Se non deve mostrare fallback, non mostrare nulla
  if (!showFallback) {
    return null
  }

  // Fallback predefinito con messaggio di errore
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        <Lock
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h5" gutterBottom>
          Accesso Negato
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Non hai i permessi necessari per accedere a questa sezione.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>Permessi richiesti:</strong>
            {requiredRoles.length > 0 && (
              <div>• Ruolo sistema: {requiredRoles.join(', ')}</div>
            )}
            {requiredDepartmentRoles.length > 0 && (
              <div>• Ruolo reparto: {requiredDepartmentRoles.join(', ')}</div>
            )}
            {departmentId && (
              <div>• Reparto specifico richiesto</div>
            )}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>I tuoi permessi:</strong>
            <div>• Ruolo sistema: {user.role}</div>
            {user.departmentRole && (
              <div>• Ruolo reparto: {user.departmentRole}</div>
            )}
          </Typography>
        </Alert>
      </Paper>
    </Box>
  )
}

// Hook per controllo permessi inline
export function useRoleAccess() {
  const { user } = useAuth()

  const hasRole = (roles: string | string[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const hasDepartmentRole = (roles: string | string[]) => {
    if (!user?.departmentRole) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.departmentRole)
  }

  const isInDepartment = (departmentId: string) => {
    return user?.departmentId === departmentId
  }

  const canAccess = (
    requiredRoles: string[] = [],
    requiredDepartmentRoles: string[] = [],
    departmentId?: string
  ) => {
    const hasSystemRole = requiredRoles.length === 0 || hasRole(requiredRoles)
    const hasDeptRole = requiredDepartmentRoles.length === 0 || 
      hasRole('ADMIN') ||
      hasDepartmentRole(requiredDepartmentRoles)
    const hasCorrectDept = !departmentId || hasRole('ADMIN') || isInDepartment(departmentId)
    
    return hasSystemRole && hasDeptRole && hasCorrectDept
  }

  return {
    user,
    hasRole,
    hasDepartmentRole,
    isInDepartment,
    canAccess,
    isAdmin: hasRole('ADMIN'),
    isSupervisor: hasRole('SUPERVISOR'),
    isOperator: hasRole('OPERATOR'),
    isCapoReparto: hasDepartmentRole('CAPO_REPARTO'),
    isCapoTurno: hasDepartmentRole('CAPO_TURNO'),
    isOperatoreReparto: hasDepartmentRole('OPERATORE'),
  }
}

// Componente per nascondere elementi in base ai ruoli
interface RoleGuardProps {
  roles?: string[]
  departmentRoles?: string[]
  departmentId?: string
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({
  roles = [],
  departmentRoles = [],
  departmentId,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { canAccess } = useRoleAccess()

  if (canAccess(roles, departmentRoles, departmentId)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}