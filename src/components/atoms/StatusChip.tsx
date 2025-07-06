'use client'

import { Chip, ChipProps } from '@mui/material'
import { ODLStatus, Priority, EventType } from '@prisma/client'

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status?: ODLStatus | Priority | EventType | string
  type?: 'odl' | 'priority' | 'event' | 'custom'
}

export function StatusChip({ status, type = 'odl', ...props }: StatusChipProps) {
  const getChipProps = (): { color: ChipProps['color']; label: string } => {
    if (type === 'odl') {
      switch (status as ODLStatus) {
        case 'CREATED':
          return { color: 'default', label: 'Creato' }
        case 'IN_CLEANROOM':
          return { color: 'info', label: 'In Clean Room' }
        case 'CLEANROOM_COMPLETED':
          return { color: 'success', label: 'Clean Room Completato' }
        case 'IN_AUTOCLAVE':
          return { color: 'warning', label: 'In Autoclave' }
        case 'AUTOCLAVE_COMPLETED':
          return { color: 'success', label: 'Autoclave Completato' }
        case 'IN_NDI':
          return { color: 'info', label: 'In NDI' }
        case 'COMPLETED':
          return { color: 'success', label: 'Completato' }
        case 'ON_HOLD':
          return { color: 'warning', label: 'In Attesa' }
        case 'CANCELLED':
          return { color: 'error', label: 'Annullato' }
        default:
          return { color: 'default', label: status as string }
      }
    }
    
    if (type === 'priority') {
      switch (status as Priority) {
        case 'LOW':
          return { color: 'default', label: 'Bassa' }
        case 'NORMAL':
          return { color: 'primary', label: 'Normale' }
        case 'HIGH':
          return { color: 'warning', label: 'Alta' }
        case 'URGENT':
          return { color: 'error', label: 'Urgente' }
        default:
          return { color: 'default', label: status as string }
      }
    }
    
    if (type === 'event') {
      switch (status as EventType) {
        case 'ENTRY':
          return { color: 'success', label: 'Ingresso' }
        case 'EXIT':
          return { color: 'info', label: 'Uscita' }
        case 'PAUSE':
          return { color: 'warning', label: 'Pausa' }
        case 'RESUME':
          return { color: 'success', label: 'Ripresa' }
        case 'NOTE':
          return { color: 'default', label: 'Nota' }
        default:
          return { color: 'default', label: status as string }
      }
    }
    
    // Custom type - use status as label directly
    return { color: 'default', label: status || '' }
  }

  const { color, label } = getChipProps()

  return (
    <Chip
      size="small"
      color={color}
      label={label}
      {...props}
    />
  )
}