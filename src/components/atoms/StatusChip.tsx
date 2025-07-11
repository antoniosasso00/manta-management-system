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
        
        // Assigned states
        case 'ASSIGNED_TO_CLEANROOM':
          return { color: 'secondary', label: 'Assegnato Clean Room' }
        case 'ASSIGNED_TO_AUTOCLAVE':
          return { color: 'secondary', label: 'Assegnato Autoclave' }
        case 'ASSIGNED_TO_CONTROLLO_NUMERICO':
          return { color: 'secondary', label: 'Assegnato CNC' }
        case 'ASSIGNED_TO_NDI':
          return { color: 'secondary', label: 'Assegnato NDI' }
        case 'ASSIGNED_TO_MONTAGGIO':
          return { color: 'secondary', label: 'Assegnato Montaggio' }
        case 'ASSIGNED_TO_VERNICIATURA':
          return { color: 'secondary', label: 'Assegnato Verniciatura' }
        case 'ASSIGNED_TO_CONTROLLO_QUALITA':
          return { color: 'secondary', label: 'Assegnato Controllo Qualità' }
        case 'ASSIGNED_TO_HONEYCOMB':
          return { color: 'secondary', label: 'Assegnato Honeycomb' }
        case 'ASSIGNED_TO_MOTORI':
          return { color: 'secondary', label: 'Assegnato Motori' }
        
        // In process states
        case 'IN_CLEANROOM':
          return { color: 'info', label: 'In Clean Room' }
        case 'IN_AUTOCLAVE':
          return { color: 'warning', label: 'In Autoclave' }
        case 'IN_CONTROLLO_NUMERICO':
          return { color: 'info', label: 'In CNC' }
        case 'IN_NDI':
          return { color: 'info', label: 'In NDI' }
        case 'IN_MONTAGGIO':
          return { color: 'info', label: 'In Montaggio' }
        case 'IN_VERNICIATURA':
          return { color: 'info', label: 'In Verniciatura' }
        case 'IN_CONTROLLO_QUALITA':
          return { color: 'info', label: 'In Controllo Qualità' }
        case 'IN_HONEYCOMB':
          return { color: 'info', label: 'In Honeycomb' }
        case 'IN_MOTORI':
          return { color: 'info', label: 'In Motori' }
        
        // Completed states
        case 'CLEANROOM_COMPLETED':
          return { color: 'success', label: 'Clean Room Completato' }
        case 'AUTOCLAVE_COMPLETED':
          return { color: 'success', label: 'Autoclave Completato' }
        case 'CONTROLLO_NUMERICO_COMPLETED':
          return { color: 'success', label: 'CNC Completato' }
        case 'NDI_COMPLETED':
          return { color: 'success', label: 'NDI Completato' }
        case 'MONTAGGIO_COMPLETED':
          return { color: 'success', label: 'Montaggio Completato' }
        case 'VERNICIATURA_COMPLETED':
          return { color: 'success', label: 'Verniciatura Completata' }
        case 'CONTROLLO_QUALITA_COMPLETED':
          return { color: 'success', label: 'Controllo Qualità Completato' }
        case 'HONEYCOMB_COMPLETED':
          return { color: 'success', label: 'Honeycomb Completato' }
        case 'MOTORI_COMPLETED':
          return { color: 'success', label: 'Motori Completato' }
        
        // Final states
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