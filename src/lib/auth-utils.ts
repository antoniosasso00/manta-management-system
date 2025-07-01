import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

/**
 * Server-side authentication utilities
 */

export async function getServerSession() {
  return await auth()
}

export async function requireAuth(redirectTo = '/login') {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireRole(role: UserRole, redirectTo = '/unauthorized') {
  const session = await requireAuth()
  
  if (session.user.role !== role) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireAnyRole(roles: UserRole[], redirectTo = '/unauthorized') {
  const session = await requireAuth()
  
  if (!roles.includes(session.user.role)) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireMinimumRole(minimumRole: UserRole, redirectTo = '/unauthorized') {
  const session = await requireAuth()
  
  const roleHierarchy = {
    [UserRole.OPERATOR]: 1,
    [UserRole.SUPERVISOR]: 2,
    [UserRole.ADMIN]: 3
  }
  
  const userRoleLevel = roleHierarchy[session.user.role]
  const requiredRoleLevel = roleHierarchy[minimumRole]
  
  if (userRoleLevel < requiredRoleLevel) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireAdmin(redirectTo = '/unauthorized') {
  return await requireRole(UserRole.ADMIN, redirectTo)
}

export async function requireSupervisorOrAdmin(redirectTo = '/unauthorized') {
  return await requireAnyRole([UserRole.SUPERVISOR, UserRole.ADMIN], redirectTo)
}

/**
 * Check if user has specific business permissions
 */
export async function checkPermissions() {
  const session = await getServerSession()
  
  if (!session?.user) {
    return {
      canManageUsers: false,
      canManageODL: false,
      canViewReports: false,
      canManageDepartments: false,
      canAssignTasks: false,
      canViewOwnTasks: false,
    }
  }
  
  const { role } = session.user
  const isAdmin = role === UserRole.ADMIN
  const isSupervisor = role === UserRole.SUPERVISOR
  
  return {
    canManageUsers: isAdmin,
    canManageODL: isAdmin || isSupervisor,
    canViewReports: isAdmin || isSupervisor,
    canManageDepartments: isAdmin,
    canAssignTasks: isAdmin || isSupervisor,
    canViewOwnTasks: true, // All authenticated users
  }
}