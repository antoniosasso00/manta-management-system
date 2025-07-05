import { auth } from '@/lib/auth-node'
import { UserRole, DepartmentRole } from '@prisma/client'
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
 * Department-based access control functions
 */

export async function requireDepartmentAccess(departmentId: string, redirectTo = '/unauthorized') {
  const session = await requireAuth()
  
  // Admin has access to all departments
  if (session.user.role === UserRole.ADMIN) {
    return session
  }
  
  // Supervisor with global access
  if (session.user.role === UserRole.SUPERVISOR && !session.user.departmentId) {
    return session
  }
  
  // User must be assigned to the specific department
  if (session.user.departmentId !== departmentId) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireDepartmentRole(
  departmentId: string, 
  requiredRole: DepartmentRole,
  redirectTo = '/unauthorized'
) {
  const session = await requireDepartmentAccess(departmentId)
  
  // Admin bypass
  if (session.user.role === UserRole.ADMIN) {
    return session
  }
  
  // Check department role hierarchy
  const roleHierarchy = {
    [DepartmentRole.OPERATORE]: 1,
    [DepartmentRole.CAPO_TURNO]: 2,
    [DepartmentRole.CAPO_REPARTO]: 3
  }
  
  const userRoleLevel = session.user.departmentRole ? roleHierarchy[session.user.departmentRole] : 0
  const requiredRoleLevel = roleHierarchy[requiredRole]
  
  if (userRoleLevel < requiredRoleLevel) {
    redirect(redirectTo)
  }
  
  return session
}

export async function requireAnyDepartmentRole(
  departmentId: string,
  roles: DepartmentRole[], 
  redirectTo = '/unauthorized'
) {
  const session = await requireDepartmentAccess(departmentId)
  
  // Admin bypass
  if (session.user.role === UserRole.ADMIN) {
    return session
  }
  
  if (!session.user.departmentRole || !roles.includes(session.user.departmentRole)) {
    redirect(redirectTo)
  }
  
  return session
}

export async function canAccessDepartment(departmentId: string): Promise<boolean> {
  try {
    const session = await getServerSession()
    
    if (!session?.user) return false
    
    // Admin can access all departments
    if (session.user.role === UserRole.ADMIN) return true
    
    // Global supervisor can access all departments
    if (session.user.role === UserRole.SUPERVISOR && !session.user.departmentId) return true
    
    // User can access their assigned department
    return session.user.departmentId === departmentId
  } catch {
    return false
  }
}

export async function canManageDepartment(departmentId: string): Promise<boolean> {
  try {
    const session = await getServerSession()
    
    if (!session?.user) return false
    
    // Admin can manage all departments
    if (session.user.role === UserRole.ADMIN) return true
    
    // Must be assigned to the department and have management role
    if (session.user.departmentId !== departmentId) return false
    
    return session.user.departmentRole === DepartmentRole.CAPO_REPARTO
  } catch {
    return false
  }
}

/**
 * Enhanced permissions check with department-specific roles
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
      // Department-specific permissions
      canManageDepartmentUsers: false,
      canManageDepartmentOperations: false,
      canViewDepartmentReports: false,
      canAssignDepartmentTasks: false,
      isCapoReparto: false,
      isCapoTurno: false,
      assignedDepartmentId: null,
    }
  }
  
  const { role, departmentRole, departmentId } = session.user
  const isAdmin = role === UserRole.ADMIN
  const isSupervisor = role === UserRole.SUPERVISOR
  const isCapoReparto = departmentRole === DepartmentRole.CAPO_REPARTO
  const isCapoTurno = departmentRole === DepartmentRole.CAPO_TURNO
  
  return {
    // System-level permissions
    canManageUsers: isAdmin,
    canManageODL: isAdmin || isSupervisor,
    canViewReports: isAdmin || isSupervisor,
    canManageDepartments: isAdmin,
    canAssignTasks: isAdmin || isSupervisor,
    canViewOwnTasks: true,
    
    // Department-specific permissions
    canManageDepartmentUsers: isAdmin || isCapoReparto,
    canManageDepartmentOperations: isAdmin || isCapoReparto || isCapoTurno,
    canViewDepartmentReports: isAdmin || isSupervisor || isCapoReparto || isCapoTurno,
    canAssignDepartmentTasks: isAdmin || isCapoReparto || isCapoTurno,
    
    // Role flags
    isCapoReparto,
    isCapoTurno,
    assignedDepartmentId: departmentId,
  }
}