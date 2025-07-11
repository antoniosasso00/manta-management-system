'use client'

import { useState } from 'react'
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material'
import { QrCode, Timer, Engineering } from '@mui/icons-material'
import { Card, StatusChip, ActionButton, WorkflowProgress } from '@/components/atoms'
import { QRDisplayModal } from './QRDisplayModal'
import { ODLTrackingStatus } from '@/domains/production'
import { EventType } from '@prisma/client'

interface ODLCardProps {
  odl: ODLTrackingStatus
  onAction: (odlId: string, actionType: EventType) => void
  loading?: boolean
}

export function ODLCard({ odl, onAction, loading = false }: ODLCardProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '--'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getAvailableActions = (): EventType[] => {
    // Se l'ODL è completato per questo reparto, nessuna azione disponibile
    const completedStates = [
      'CLEANROOM_COMPLETED', 'AUTOCLAVE_COMPLETED', 'CONTROLLO_NUMERICO_COMPLETED',
      'NDI_COMPLETED', 'MONTAGGIO_COMPLETED', 'VERNICIATURA_COMPLETED',
      'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED'
    ]
    
    if (completedStates.includes(odl.status)) {
      return [] // Nessuna azione disponibile se completato
    }
    
    // Se non ci sono eventi precedenti, è un ODL non assegnato
    if (!odl.lastEvent) return ['ENTRY']
    
    switch (odl.lastEvent.eventType) {
      case 'ASSIGNED':
        // ODL assegnato ma non ancora entrato
        return ['ENTRY']
      case 'ENTRY':
        return ['EXIT', 'PAUSE']
      case 'EXIT':
        // Se è uscito ma lo stato non è completato, potrebbe essere un errore
        // Non permettere il re-entry
        return []
      case 'PAUSE':
        return ['RESUME']
      case 'RESUME':
        return ['EXIT', 'PAUSE']
      default:
        return ['ENTRY']
    }
  }

  const availableActions = getAvailableActions()

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {odl.odlNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {odl.part.partNumber} - {odl.part.description}
            </Typography>
          </Box>
          <Tooltip title="Mostra QR Code">
            <IconButton 
              size={isMobile ? "medium" : "small"} 
              onClick={() => setQrModalOpen(true)}
              sx={{ 
                width: { xs: 44, sm: 40 },
                height: { xs: 44, sm: 40 }
              }}
            >
              <QrCode />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status and Info */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusChip status={odl.status} type="odl" />
          <StatusChip status={odl.priority} type="priority" />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Engineering fontSize="small" color="action" />
            <Typography variant="body2">
              Qtà: {odl.quantity}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer fontSize="small" color="action" />
            <Typography variant="body2">
              {formatTime(odl.timeInCurrentDepartment)}
            </Typography>
          </Box>
        </Box>

        {/* Current Status */}
        {odl.currentDepartment && (
          <Box sx={{ 
            bgcolor: 'background.default', 
            p: 1, 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary">
              Reparto attuale
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {odl.currentDepartment.name}
            </Typography>
          </Box>
        )}
        
        {/* Workflow Progress */}
        <WorkflowProgress currentStatus={odl.status as any} compact />

        {/* Actions - Mobile optimized */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1, 
          flexWrap: 'wrap' 
        }}>
          {availableActions.length > 0 ? (
            availableActions.map((action) => (
              <ActionButton
                key={action}
                actionType={action}
                onClick={() => onAction(odl.id, action)}
                loading={loading}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 auto' }, 
                  minWidth: { xs: '100%', sm: 120 },
                  minHeight: { xs: 48, sm: 40 }
                }}
              />
            ))
          ) : (
            <Box sx={{ 
              width: '100%', 
              textAlign: 'center', 
              py: 2, 
              px: 1,
              bgcolor: 'success.light',
              borderRadius: 1
            }}>
              <Typography variant="body2" color="success.dark" sx={{ fontWeight: 500 }}>
                ✓ ODL completato in questo reparto
              </Typography>
              <Typography variant="caption" color="text.secondary">
                In attesa di trasferimento al reparto successivo
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>

      {/* QR Display Modal */}
      <QRDisplayModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        odl={odl}
      />
    </Card>
  )
}