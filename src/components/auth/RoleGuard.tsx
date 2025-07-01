'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@prisma/client'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  requireRole?: UserRole
  requireMinimumRole?: UserRole
  fallback?: ReactNode
  invert?: boolean // If true, shows content when user DOESN'T have permission
}

/**
 * Component to conditionally render content based on user roles
 * Unlike ProtectedRoute, this doesn't show error messages, just shows/hides content
 */
export function RoleGuard({
  children,
  allowedRoles,
  requireRole,
  requireMinimumRole,
  fallback = null,
  invert = false
}: RoleGuardProps) {
  const { isAuthenticated, hasRole, hasAnyRole, hasMinimumRole } = useAuth()

  // If not authenticated, don't show content (unless inverted)
  if (!isAuthenticated) {
    return invert ? <>{children}</> : <>{fallback}</>
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

  // Apply invert logic
  const shouldShow = invert ? !hasPermission : hasPermission

  return shouldShow ? <>{children}</> : <>{fallback}</>
}

// Convenience components for common use cases
export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard requireRole={UserRole.ADMIN} fallback={fallback}>
    {children}
  </RoleGuard>
)

export const SupervisorOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard requireRole={UserRole.SUPERVISOR} fallback={fallback}>
    {children}
  </RoleGuard>
)

export const OperatorOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard requireRole={UserRole.OPERATOR} fallback={fallback}>
    {children}
  </RoleGuard>
)

export const SupervisorOrAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
)

export const NotOperator = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard requireRole={UserRole.OPERATOR} invert fallback={fallback}>
    {children}
  </RoleGuard>
)