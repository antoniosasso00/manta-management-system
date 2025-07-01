import { useAuth } from './useAuth'
import { UserRole, DepartmentRole } from '@prisma/client'

export interface Permission {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface TablePermissions {
  parts: Permission
  tools: Permission
  curingCycles: Permission
  departments: Permission
  autoclaves: Permission
  odls: Permission
  users: Permission
  productionEvents: Permission
  autoclaveLoads: Permission
}

export function usePermissions() {
  const { user } = useAuth()

  if (!user) {
    const noPermission: Permission = {
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
    
    return {
      parts: noPermission,
      tools: noPermission,
      curingCycles: noPermission,
      departments: noPermission,
      autoclaves: noPermission,
      odls: noPermission,
      users: noPermission,
      productionEvents: noPermission,
      autoclaveLoads: noPermission,
    } as TablePermissions
  }

  const { role, departmentRole } = user

  // Helper functions for role checks
  const isAdmin = () => role === UserRole.ADMIN
  const isSupervisor = () => role === UserRole.SUPERVISOR
  const isCapoReparto = () => departmentRole === DepartmentRole.CAPO_REPARTO
  const isCapoTurno = () => departmentRole === DepartmentRole.CAPO_TURNO
  // const isOperatore = () => departmentRole === DepartmentRole.OPERATORE

  // Permission calculation functions
  const getPartsPermissions = (): Permission => ({
    canView: true, // All authenticated users can view parts
    canCreate: isAdmin() || isSupervisor() || isCapoReparto(),
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto(),
    canDelete: isAdmin(), // Only admin can delete parts
  })

  const getToolsPermissions = (): Permission => ({
    canView: true, // All users need to see tools for production
    canCreate: isAdmin() || isSupervisor() || isCapoReparto(),
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto(),
    canDelete: isAdmin(),
  })

  const getCuringCyclesPermissions = (): Permission => ({
    canView: true, // All users need to see curing cycles
    canCreate: isAdmin() || isSupervisor(),
    canUpdate: isAdmin() || isSupervisor(),
    canDelete: isAdmin(),
  })

  const getDepartmentsPermissions = (): Permission => ({
    canView: true, // All users can view departments
    canCreate: isAdmin(),
    canUpdate: isAdmin(),
    canDelete: isAdmin(),
  })

  const getAutoclavesPermissions = (): Permission => ({
    canView: true, // All users can view autoclaves
    canCreate: isAdmin() || isSupervisor(),
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto(),
    canDelete: isAdmin(),
  })

  const getODLsPermissions = (): Permission => ({
    canView: true, // All users can view ODLs
    canCreate: isAdmin() || isSupervisor() || isCapoReparto(),
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto() || isCapoTurno(),
    canDelete: isAdmin() || isSupervisor(),
  })

  const getUsersPermissions = (): Permission => ({
    canView: isAdmin() || isSupervisor() || isCapoReparto(),
    canCreate: isAdmin(),
    canUpdate: isAdmin(),
    canDelete: isAdmin(),
  })

  const getProductionEventsPermissions = (): Permission => ({
    canView: true, // All users can view production events
    canCreate: true, // All users can create events (QR scanning)
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto(),
    canDelete: isAdmin(),
  })

  const getAutoclaveLoadsPermissions = (): Permission => ({
    canView: true, // All users can view autoclave loads
    canCreate: isAdmin() || isSupervisor() || isCapoReparto(),
    canUpdate: isAdmin() || isSupervisor() || isCapoReparto(),
    canDelete: isAdmin() || isSupervisor(),
  })

  return {
    parts: getPartsPermissions(),
    tools: getToolsPermissions(),
    curingCycles: getCuringCyclesPermissions(),
    departments: getDepartmentsPermissions(),
    autoclaves: getAutoclavesPermissions(),
    odls: getODLsPermissions(),
    users: getUsersPermissions(),
    productionEvents: getProductionEventsPermissions(),
    autoclaveLoads: getAutoclaveLoadsPermissions(),
  } as TablePermissions
}

// Utility hook for checking specific permissions
export function useCanAccess(table: keyof TablePermissions, action: keyof Permission) {
  const permissions = usePermissions()
  return permissions[table][action]
}

// Component helper for conditional rendering
export function usePermissionGuard() {
  const permissions = usePermissions()
  
  return {
    canAccess: (table: keyof TablePermissions, action: keyof Permission) => {
      return permissions[table][action]
    },
    requirePermission: (table: keyof TablePermissions, action: keyof Permission) => {
      if (!permissions[table][action]) {
        throw new Error(`Access denied: ${action} permission required for ${table}`)
      }
      return true
    },
  }
}