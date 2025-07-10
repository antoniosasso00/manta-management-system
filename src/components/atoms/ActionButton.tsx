'use client'

import { Button, ButtonProps, CircularProgress, Alert, Snackbar } from '@mui/material'
import { PlayArrow, Stop, Pause, CheckCircle, PlayCircle } from '@mui/icons-material'
import { EventType } from '@prisma/client'
import { getDepartmentNomenclature } from '@/config/departmentNomenclature'
import { useState } from 'react'

interface ActionButtonProps extends Omit<ButtonProps, 'startIcon'> {
  actionType: EventType | 'complete'
  loading?: boolean
  departmentCode?: string
  // Nuove props per integrazione workflow
  odlId?: string
  departmentId?: string
  onActionComplete?: (result: WorkflowActionResult) => void
  onActionError?: (error: string) => void
  // Manteniamo la compatibilità con il sistema esistente
  onClick?: () => void | Promise<void>
}

interface WorkflowActionResult {
  success: boolean
  message: string
  autoTransfer?: {
    success: boolean
    message: string
    newStatus?: string
    nextDepartment?: {
      id: string
      name: string
      type: string
    }
  }
  warnings?: string[]
}

export function ActionButton({ 
  actionType, 
  loading = false, 
  children,
  disabled,
  departmentCode,
  odlId,
  departmentId,
  onActionComplete,
  onActionError,
  onClick,
  ...props 
}: ActionButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })
  /**
   * Esegue l'azione workflow chiamando la nuova API unificata
   */
  const executeWorkflowAction = async () => {
    if (!odlId || !departmentId || actionType === 'complete') {
      // Modalità compatibilità - usa il click handler esistente
      if (onClick) {
        setIsExecuting(true)
        try {
          await onClick()
        } catch (error) {
          onActionError?.(error instanceof Error ? error.message : 'Errore durante l\'azione')
        } finally {
          setIsExecuting(false)
        }
      }
      return
    }

    setIsExecuting(true)

    try {
      const response = await fetch('/api/workflow/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          odlId,
          departmentId,
          actionType,
          confirmationRequired: false, // Per ActionButton non richiediamo conferma esplicita
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Errore durante l\'azione')
      }

      // Notifica successo
      let message = result.message
      if (result.autoTransfer?.success) {
        message += ` → ${result.autoTransfer.nextDepartment?.name}`
      }

      setNotification({
        open: true,
        message,
        severity: result.warnings?.length > 0 ? 'warning' : 'success'
      })

      onActionComplete?.(result)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'azione'
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
      onActionError?.(errorMessage)
    } finally {
      setIsExecuting(false)
    }
  }

  const getButtonProps = (): { 
    startIcon: React.ReactNode; 
    color: ButtonProps['color']; 
    label: string 
  } => {
    // Se abbiamo un codice reparto, usa la nomenclatura specifica
    const nomenclature = departmentCode ? getDepartmentNomenclature(departmentCode) : null
    
    switch (actionType) {
      case 'ENTRY':
        return { 
          startIcon: <PlayArrow />, 
          color: 'success', 
          label: children as string || (nomenclature?.actions?.start || 'Inizia') 
        }
      case 'EXIT':
        return { 
          startIcon: <Stop />, 
          color: 'error', 
          label: children as string || (nomenclature?.actions?.complete || 'Termina') 
        }
      case 'PAUSE':
        return { 
          startIcon: <Pause />, 
          color: 'warning', 
          label: children as string || 'Pausa' 
        }
      case 'RESUME':
        return { 
          startIcon: <PlayCircle />, 
          color: 'success', 
          label: children as string || 'Riprendi' 
        }
      case 'complete':
        return { 
          startIcon: <CheckCircle />, 
          color: 'primary', 
          label: children as string || 'Completa' 
        }
      default:
        return { 
          startIcon: null, 
          color: 'primary', 
          label: children as string || 'Azione' 
        }
    }
  }

  const { startIcon, color, label } = getButtonProps()
  const isLoading = loading || isExecuting

  return (
    <>
      <Button
        variant="contained"
        color={color}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : startIcon}
        disabled={disabled || isLoading}
        onClick={executeWorkflowAction}
        {...props}
      >
        {label}
      </Button>

      {/* Snackbar per feedback azioni */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}