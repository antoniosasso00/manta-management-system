'use client'

import { ReactNode } from 'react'
import { Alert } from '@mui/material'
import { usePermissions, type TablePermissions, type Permission } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  table: keyof TablePermissions
  action: keyof Permission
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}

export function PermissionGuard({ 
  table, 
  action, 
  children, 
  fallback = null,
  showError = false 
}: PermissionGuardProps) {
  const permissions = usePermissions()
  
  const hasPermission = permissions[table][action]
  
  if (!hasPermission) {
    if (showError) {
      return (
        <Alert severity="error">
          You do not have permission to {action} {table}.
        </Alert>
      )
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface ConditionalRenderProps {
  table: keyof TablePermissions
  action: keyof Permission
  children: ReactNode
}

export function ConditionalRender({ table, action, children }: ConditionalRenderProps) {
  const permissions = usePermissions()
  
  if (!permissions[table][action]) {
    return null
  }
  
  return <>{children}</>
}