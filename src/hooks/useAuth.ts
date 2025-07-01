'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const user = session?.user

  // Role checking utilities
  const isAdmin = user?.role === UserRole.ADMIN
  const isSupervisor = user?.role === UserRole.SUPERVISOR
  const isOperator = user?.role === UserRole.OPERATOR

  // Permission checking utilities
  const hasRole = (role: UserRole) => user?.role === role
  const hasAnyRole = (roles: UserRole[]) => roles.includes(user?.role as UserRole)
  const hasMinimumRole = (minimumRole: UserRole) => {
    if (!user?.role) return false
    
    const roleHierarchy = {
      [UserRole.OPERATOR]: 1,
      [UserRole.SUPERVISOR]: 2, 
      [UserRole.ADMIN]: 3
    }
    
    return roleHierarchy[user.role] >= roleHierarchy[minimumRole]
  }

  // Business logic permissions
  const canManageUsers = isAdmin
  const canManageODL = isAdmin || isSupervisor
  const canViewReports = isAdmin || isSupervisor
  const canManageDepartments = isAdmin
  const canAssignTasks = isAdmin || isSupervisor
  const canViewOwnTasks = isAuthenticated // All authenticated users can view their tasks

  return {
    // Session data
    user,
    session,
    isLoading,
    isAuthenticated,
    
    // Role checks
    isAdmin,
    isSupervisor,
    isOperator,
    
    // Permission utilities
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    
    // Business permissions
    canManageUsers,
    canManageODL,
    canViewReports,
    canManageDepartments,
    canAssignTasks,
    canViewOwnTasks,
  }
}

// Type for the hook return value
export type UseAuthReturn = ReturnType<typeof useAuth>