'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@prisma/client'
import { Box, Typography, Paper, Button } from '@mui/material'
import { Lock as LockIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  requireRole?: UserRole
  requireMinimumRole?: UserRole
  fallback?: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireRole,
  requireMinimumRole,
  fallback,
  redirectTo
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasAnyRole, hasMinimumRole } = useAuth()
  const router = useRouter()

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Caricamento...</Typography>
      </Box>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }
    
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" p={3}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Accesso Richiesto
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Devi effettuare il login per accedere a questa sezione.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/login')}
            fullWidth
          >
            Vai al Login
          </Button>
        </Paper>
      </Box>
    )
  }

  // Check role permissions
  let hasPermission = true

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    hasPermission = false
  }

  if (requireRole && !hasRole(requireRole)) {
    hasPermission = false
  }

  if (requireMinimumRole && !hasMinimumRole(requireMinimumRole)) {
    hasPermission = false
  }

  // Show unauthorized message
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" p={3}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <LockIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Accesso Negato
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Non hai i permessi necessari per accedere a questa sezione.
          </Typography>
          <Typography variant="caption" color="text.secondary" mb={3}>
            Ruolo richiesto: {requireMinimumRole || requireRole || allowedRoles?.join(', ')}
            <br />
            Il tuo ruolo: {user?.role}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => router.back()}
            fullWidth
          >
            Torna Indietro
          </Button>
        </Paper>
      </Box>
    )
  }

  // Render protected content
  return <>{children}</>
}