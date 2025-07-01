'use client'

import { useState, useEffect, useCallback } from 'react'
import { Box, Alert, Typography } from '@mui/material'
import { UserRole, DepartmentRole } from '@prisma/client'
import { DepartmentSelect, DepartmentRoleSelect } from '@/components/atoms'

export interface DepartmentAssignmentFormProps {
  userRole: UserRole
  departmentId?: string | null
  departmentRole?: DepartmentRole | null
  onDepartmentChange: (departmentId: string | null) => void
  onDepartmentRoleChange: (departmentRole: DepartmentRole | null) => void
  error?: boolean
  helperText?: string
  disabled?: boolean
  required?: boolean
}

export function DepartmentAssignmentForm({
  userRole,
  departmentId,
  departmentRole,
  onDepartmentChange,
  onDepartmentRoleChange,
  error = false,
  helperText,
  disabled = false,
  required = false,
}: DepartmentAssignmentFormProps) {
  const [localDepartmentId, setLocalDepartmentId] = useState<string | null>(departmentId || null)
  const [localDepartmentRole, setLocalDepartmentRole] = useState<DepartmentRole | null>(departmentRole || null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Regole di business per l'assegnazione reparto
  const isAdmin = userRole === UserRole.ADMIN
  const isOperator = userRole === UserRole.OPERATOR
  const isSupervisor = userRole === UserRole.SUPERVISOR

  // ADMIN non possono avere assegnazioni di reparto
  const shouldDisableDepartment = isAdmin || disabled
  
  // OPERATOR devono avere un reparto assegnato
  const isDepartmentRequired = isOperator || required

  // Se ha un reparto, deve avere anche un ruolo di reparto
  const isDepartmentRoleRequired = !!localDepartmentId

  const validateAssignment = useCallback(() => {
    let error: string | null = null

    // ADMIN non possono avere reparto
    if (isAdmin && (localDepartmentId || localDepartmentRole)) {
      error = 'Gli amministratori non possono essere assegnati a un reparto specifico'
    }
    // OPERATOR devono avere reparto
    else if (isOperator && !localDepartmentId) {
      error = 'Gli operatori devono essere assegnati a un reparto'
    }
    // Se ha reparto, deve avere ruolo reparto
    else if (localDepartmentId && !localDepartmentRole) {
      error = 'Seleziona un ruolo per il reparto assegnato'
    }
    // Se ha ruolo reparto, deve avere reparto
    else if (localDepartmentRole && !localDepartmentId) {
      error = 'Seleziona un reparto per il ruolo assegnato'
    }

    setValidationError(error)
  }, [isAdmin, isOperator, localDepartmentId, localDepartmentRole])

  useEffect(() => {
    validateAssignment()
  }, [validateAssignment])

  const handleDepartmentChange = (value: string) => {
    const newDepartmentId = value || null
    setLocalDepartmentId(newDepartmentId)
    onDepartmentChange(newDepartmentId)

    // Se rimuove il reparto, rimuove anche il ruolo reparto
    if (!newDepartmentId) {
      setLocalDepartmentRole(null)
      onDepartmentRoleChange(null)
    }
  }

  const handleDepartmentRoleChange = (value: DepartmentRole | '') => {
    const newDepartmentRole = value || null
    setLocalDepartmentRole(newDepartmentRole)
    onDepartmentRoleChange(newDepartmentRole)
  }

  const getInfoMessage = () => {
    if (isAdmin) {
      return 'Gli amministratori hanno accesso completo a tutti i reparti'
    }
    if (isSupervisor && !localDepartmentId) {
      return 'I supervisori senza reparto assegnato hanno accesso a tutti i reparti'
    }
    if (isSupervisor && localDepartmentId) {
      return 'Questo supervisore avrà accesso specifico al reparto assegnato'
    }
    if (isOperator) {
      return 'Gli operatori devono essere assegnati a un reparto specifico'
    }
    return null
  }

  const infoMessage = getInfoMessage()
  const displayError = error || !!validationError
  const displayHelperText = helperText || validationError

  return (
    <Box>
      {infoMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {infoMessage}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Selettore Reparto */}
        <DepartmentSelect
          label="Reparto Assegnato"
          value={localDepartmentId || ''}
          onChange={(e) => handleDepartmentChange(e.target.value as string)}
          disabled={shouldDisableDepartment}
          required={isDepartmentRequired}
          error={displayError}
          helperText={displayError ? displayHelperText || undefined : undefined}
        />

        {/* Selettore Ruolo Reparto */}
        {!isAdmin && (
          <DepartmentRoleSelect
            label="Ruolo nel Reparto"
            value={localDepartmentRole || ''}
            onChange={(e) => handleDepartmentRoleChange(e.target.value as DepartmentRole)}
            disabled={disabled || !localDepartmentId}
            required={isDepartmentRoleRequired}
            showDescriptions={true}
            helperText={
              !localDepartmentId 
                ? 'Seleziona prima un reparto' 
                : undefined
            }
          />
        )}

        {/* Descrizione ruolo selezionato */}
        {localDepartmentRole && (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Responsabilità del ruolo:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {getRoleResponsibilities(localDepartmentRole)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function getRoleResponsibilities(role: DepartmentRole): string {
  switch (role) {
    case DepartmentRole.CAPO_REPARTO:
      return 'Gestione completa del reparto: assegnazione lavori, supervisione operatori, ottimizzazione processi, reporting performance.'
    case DepartmentRole.CAPO_TURNO:
      return 'Supervisione operatori durante il turno, gestione attività produttive, risoluzione problemi operativi.'
    case DepartmentRole.OPERATORE:
      return 'Esecuzione attività produttive, scansione QR per tracciabilità, registrazione eventi di produzione.'
    default:
      return ''
  }
}