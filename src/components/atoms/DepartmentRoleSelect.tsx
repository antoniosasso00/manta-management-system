'use client'

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { SelectProps } from '@mui/material/Select'
import { 
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
} from '@mui/icons-material'
import { DepartmentRole } from '@prisma/client'
import { ROLE_DISPLAY_NAMES } from '@/utils/constants'

export interface DepartmentRoleSelectProps extends Omit<SelectProps, 'children'> {
  label?: string
  error?: boolean
  helperText?: string
  required?: boolean
  showIcons?: boolean
  showDescriptions?: boolean
}

export function DepartmentRoleSelect({
  label = 'Ruolo nel Reparto',
  error = false,
  helperText,
  required = false,
  showIcons = true,
  showDescriptions = false,
  ...props
}: DepartmentRoleSelectProps) {

  const getRoleIcon = (role: DepartmentRole) => {
    switch (role) {
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

  const getRoleDescription = (role: DepartmentRole) => {
    switch (role) {
      case DepartmentRole.CAPO_REPARTO:
        return 'Gestione completa del reparto, assegnazione lavori, supervisione operatori'
      case DepartmentRole.CAPO_TURNO:
        return 'Supervisione operatori del turno, gestione attività produttive'
      case DepartmentRole.OPERATORE:
        return 'Esecuzione attività produttive, scansione QR, registrazione eventi'
      default:
        return ''
    }
  }

  const departmentRoles = Object.values(DepartmentRole)

  return (
    <FormControl fullWidth error={error} required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        {...props}
        label={label}
      >
        {/* Opzione vuota */}
        <MenuItem value="">
          <em>Nessun ruolo</em>
        </MenuItem>
        
        {/* Lista ruoli di reparto */}
        {departmentRoles.map((role) => (
          <MenuItem key={role} value={role}>
            {showIcons ? (
              <ListItemIcon>
                {getRoleIcon(role)}
              </ListItemIcon>
            ) : null}
            
            <ListItemText
              primary={ROLE_DISPLAY_NAMES[role]}
              secondary={showDescriptions ? getRoleDescription(role) : undefined}
              secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.secondary',
              }}
            />
          </MenuItem>
        ))}
      </Select>
      
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  )
}