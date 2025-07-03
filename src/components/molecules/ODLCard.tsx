'use client'

import { useState } from 'react'
import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material'
import { QrCode, Timer, Engineering } from '@mui/icons-material'
import { Card, StatusChip, ActionButton } from '@/components/atoms'
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

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '--'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getAvailableActions = (): EventType[] => {
    if (!odl.lastEvent) return ['ENTRY']
    
    switch (odl.lastEvent.eventType) {
      case 'ENTRY':
        return ['EXIT', 'PAUSE']
      case 'EXIT':
        return ['ENTRY']
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
            <IconButton size="small" onClick={() => setQrModalOpen(true)}>
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

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {availableActions.map((action) => (
            <ActionButton
              key={action}
              actionType={action}
              onClick={() => onAction(odl.id, action)}
              loading={loading}
              size="small"
              sx={{ flex: '1 1 auto', minWidth: 120 }}
            />
          ))}
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