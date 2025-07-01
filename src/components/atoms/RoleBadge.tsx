'use client'

import { Chip, ChipProps } from '@mui/material'
import { 
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
} from '@mui/icons-material'
import { UserRole, DepartmentRole } from '@prisma/client'
import { ROLE_DISPLAY_NAMES } from '@/utils/constants'

export interface RoleBadgeProps extends Omit<ChipProps, 'label' | 'color' | 'icon' | 'variant'> {
  role: UserRole
  departmentRole?: DepartmentRole | null
  showIcon?: boolean
  variant?: 'system' | 'department' | 'combined'
}

export function RoleBadge({ 
  role, 
  departmentRole, 
  showIcon = true, 
  variant = 'combined',
  size = 'small',
  ...props 
}: RoleBadgeProps) {
  
  // Colori per ruoli di sistema
  const getSystemRoleColor = (role: UserRole): ChipProps['color'] => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error'
      case UserRole.SUPERVISOR:
        return 'warning'
      case UserRole.OPERATOR:
        return 'primary'
      default:
        return 'default'
    }
  }

  // Colori per ruoli di reparto
  const getDepartmentRoleColor = (departmentRole: DepartmentRole): ChipProps['color'] => {
    switch (departmentRole) {
      case DepartmentRole.CAPO_REPARTO:
        return 'success'
      case DepartmentRole.CAPO_TURNO:
        return 'info'
      case DepartmentRole.OPERATORE:
        return 'secondary'
      default:
        return 'default'
    }
  }

  // Icone per ruoli di sistema
  const getSystemRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <AdminIcon fontSize="small" />
      case UserRole.SUPERVISOR:
        return <SupervisorIcon fontSize="small" />
      case UserRole.OPERATOR:
        return <PersonIcon fontSize="small" />
      default:
        return null
    }
  }

  // Icone per ruoli di reparto
  const getDepartmentRoleIcon = (departmentRole: DepartmentRole) => {
    switch (departmentRole) {
      case DepartmentRole.CAPO_REPARTO:
        return <BusinessIcon fontSize="small" />
      case DepartmentRole.CAPO_TURNO:
        return <ScheduleIcon fontSize="small" />
      case DepartmentRole.OPERATORE:
        return <BuildIcon fontSize="small" />
      default:
        return null
    }
  }

  // Rendering basato su variant
  if (variant === 'system') {
    return (
      <Chip
        label={ROLE_DISPLAY_NAMES[role]}
        color={getSystemRoleColor(role)}
        icon={showIcon ? getSystemRoleIcon(role) || undefined : undefined}
        size={size}
        {...props}
      />
    )
  }

  if (variant === 'department' && departmentRole) {
    return (
      <Chip
        label={ROLE_DISPLAY_NAMES[departmentRole]}
        color={getDepartmentRoleColor(departmentRole)}
        icon={showIcon ? getDepartmentRoleIcon(departmentRole) || undefined : undefined}
        size={size}
        {...props}
      />
    )
  }

  if (variant === 'combined') {
    // Se non ha ruolo di reparto, mostra solo quello di sistema
    if (!departmentRole) {
      return (
        <Chip
          label={ROLE_DISPLAY_NAMES[role]}
          color={getSystemRoleColor(role)}
          icon={showIcon ? getSystemRoleIcon(role) || undefined : undefined}
          size={size}
          {...props}
        />
      )
    }

    // Se ha entrambi, mostra quello di reparto (più specifico)
    return (
      <Chip
        label={`${ROLE_DISPLAY_NAMES[departmentRole]} (${ROLE_DISPLAY_NAMES[role]})`}
        color={getDepartmentRoleColor(departmentRole)}
        icon={showIcon ? getDepartmentRoleIcon(departmentRole) || undefined : undefined}
        size={size}
        {...props}
      />
    )
  }

  // Fallback
  return (
    <Chip
      label={ROLE_DISPLAY_NAMES[role]}
      color="default"
      size={size}
      {...props}
    />
  )
}