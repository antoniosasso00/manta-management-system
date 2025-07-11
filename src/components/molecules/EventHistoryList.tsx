'use client'

import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material'
import { 
  Login as EntryIcon, 
  Logout as ExitIcon, 
  Pause as PauseIcon, 
  PlayArrow as ResumeIcon,
  Note as NoteIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { StatusChip } from '@/components/atoms'
import { ProductionEventResponse } from '@/domains/production'
import { EventType } from '@prisma/client'

interface EventHistoryListProps {
  events: ProductionEventResponse[]
  showODLInfo?: boolean
}

export function EventHistoryList({ events, showODLInfo = false }: EventHistoryListProps) {
  const getEventIcon = (eventType: EventType) => {
    switch (eventType) {
      case 'ENTRY':
        return <EntryIcon color="success" />
      case 'EXIT':
        return <ExitIcon color="info" />
      case 'PAUSE':
        return <PauseIcon color="warning" />
      case 'RESUME':
        return <ResumeIcon color="success" />
      case 'NOTE':
        return <NoteIcon color="action" />
      default:
        return null
    }
  }

  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Nessun evento registrato
        </Typography>
      </Box>
    )
  }

  return (
    <List sx={{ width: '100%' }}>
      {events.map((event, index) => (
        <Box key={event.id}>
          <ListItem alignItems="flex-start">
            <ListItemIcon sx={{ mt: 1 }}>
              {getEventIcon(event.eventType)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <StatusChip status={event.eventType} type="event" />
                  <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}
                  </Box>
                </Box>
              }
              secondary={
                <Box component="div">
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>
                    {event.department.name}
                  </Box>
                  {event.user && (
                    <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      {' • '}{event.user.name || event.user.email}
                    </Box>
                  )}
                  {showODLInfo && (
                    <Box component="div" sx={{ mt: 0.5 }}>
                      <Chip 
                        label={`ODL: ${event.odl.odlNumber}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {event.odl.part.partNumber}
                      </Box>
                    </Box>
                  )}
                  {event.notes && (
                    <Box 
                      component="div" 
                      sx={{ 
                        fontSize: '0.875rem', 
                        color: 'text.secondary', 
                        mt: 0.5, 
                        fontStyle: 'italic' 
                      }}
                    >
                      Note: {event.notes}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
          {index < events.length - 1 && <Divider variant="inset" component="li" />}
        </Box>
      ))}
    </List>
  )
}