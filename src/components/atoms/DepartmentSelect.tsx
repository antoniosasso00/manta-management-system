'use client'

import { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
} from '@mui/material'
import { SelectProps } from '@mui/material/Select'
import { DepartmentType } from '@prisma/client'

interface Department {
  id: string
  code: string
  name: string
  type: DepartmentType
}

export interface DepartmentSelectProps extends Omit<SelectProps, 'children'> {
  label?: string
  error?: boolean
  helperText?: string
  required?: boolean
  showCode?: boolean
}

export function DepartmentSelect({
  label = 'Reparto',
  error = false,
  helperText,
  required = false,
  showCode = true,
  disabled,
  ...props
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      
      const response = await fetch('/api/departments')
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments)
      } else {
        setFetchError('Errore nel caricamento dei reparti')
      }
    } catch {
      setFetchError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentTypeIcon = (type: DepartmentType) => {
    const icons: Record<DepartmentType, string> = {
      [DepartmentType.CLEANROOM]: '🧪',
      [DepartmentType.AUTOCLAVE]: '🔥',
      [DepartmentType.NDI]: '🔍',
      [DepartmentType.HONEYCOMB]: '🍯',
      [DepartmentType.CONTROLLO_NUMERICO]: '⚙️',
      [DepartmentType.MONTAGGIO]: '🔧',
      [DepartmentType.VERNICIATURA]: '🎨',
      [DepartmentType.MOTORI]: '🚀',
      [DepartmentType.CONTROLLO_QUALITA]: '✅',
      [DepartmentType.OTHER]: '📋',
    }
    return icons[type] || '📋'
  }

  const formatDepartmentName = (department: Department) => {
    const icon = getDepartmentTypeIcon(department.type)
    const code = showCode ? `${department.code} - ` : ''
    return `${icon} ${code}${department.name}`
  }

  const isDisabled = disabled || loading || !!fetchError

  return (
    <FormControl fullWidth error={error} required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        {...props}
        label={label}
        disabled={isDisabled}
        endAdornment={
          loading ? (
            <Box sx={{ mr: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : undefined
        }
      >
        {/* Opzione vuota per "nessun reparto" */}
        <MenuItem value="">
          <em>Nessun reparto</em>
        </MenuItem>
        
        {/* Lista reparti */}
        {departments.map((department) => (
          <MenuItem key={department.id} value={department.id}>
            {formatDepartmentName(department)}
          </MenuItem>
        ))}
        
        {/* Stato di errore */}
        {fetchError && (
          <MenuItem disabled>
            <em>{fetchError}</em>
          </MenuItem>
        )}
        
        {/* Stato vuoto */}
        {!loading && !fetchError && departments.length === 0 && (
          <MenuItem disabled>
            <em>Nessun reparto disponibile</em>
          </MenuItem>
        )}
      </Select>
      
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  )
}