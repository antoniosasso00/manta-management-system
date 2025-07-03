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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <StatusChip status={event.eventType} type="event" />
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" component="span">
                    {event.department.name}
                  </Typography>
                  {event.user && (
                    <Typography variant="body2" color="text.secondary" component="span">
                      {' • '}{event.user.name || event.user.email}
                    </Typography>
                  )}
                  {showODLInfo && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={`ODL: ${event.odl.odlNumber}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {event.odl.part.partNumber}
                      </Typography>
                    </Box>
                  )}
                  {event.notes && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mt: 0.5, fontStyle: 'italic' }}
                    >
                      Note: {event.notes}
                    </Typography>
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