'use client'

import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { PlayArrow, Stop, Pause, CheckCircle } from '@mui/icons-material'
import { EventType } from '@prisma/client'

interface ActionButtonProps extends Omit<ButtonProps, 'startIcon'> {
  actionType: EventType | 'complete'
  loading?: boolean
}

export function ActionButton({ 
  actionType, 
  loading = false, 
  children,
  disabled,
  ...props 
}: ActionButtonProps) {
  const getButtonProps = (): { 
    startIcon: React.ReactNode; 
    color: ButtonProps['color']; 
    label: string 
  } => {
    switch (actionType) {
      case 'ENTRY':
        return { 
          startIcon: <PlayArrow />, 
          color: 'success', 
          label: children as string || 'Inizia Laminazione' 
        }
      case 'EXIT':
        return { 
          startIcon: <Stop />, 
          color: 'error', 
          label: children as string || 'Termina Laminazione' 
        }
      case 'PAUSE':
        return { 
          startIcon: <Pause />, 
          color: 'warning', 
          label: children as string || 'Pausa' 
        }
      case 'RESUME':
        return { 
          startIcon: <PlayArrow />, 
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

  return (
    <Button
      variant="contained"
      color={color}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      disabled={disabled || loading}
      {...props}
    >
      {label}
    </Button>
  )
}