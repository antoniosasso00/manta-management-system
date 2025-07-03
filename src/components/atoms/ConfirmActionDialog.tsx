'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material'
import { Warning } from '@mui/icons-material'

interface ConfirmActionDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  timeoutSeconds?: number
  onConfirm: () => void
  onCancel: () => void
  severity?: 'info' | 'warning' | 'error'
}

export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  timeoutSeconds = 5,
  onConfirm,
  onCancel,
  severity = 'info',
}: ConfirmActionDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds)
  const [canConfirm, setCanConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      setTimeRemaining(timeoutSeconds)
      setCanConfirm(false)
      
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanConfirm(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [open, timeoutSeconds])

  const getSeverityColor = () => {
    switch (severity) {
      case 'warning':
        return 'warning.main'
      case 'error':
        return 'error.main'
      default:
        return 'info.main'
    }
  }

  const progress = ((timeoutSeconds - timeRemaining) / timeoutSeconds) * 100

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canConfirm}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: getSeverityColor() }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>
        {!canConfirm && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Attendi {timeRemaining} secondi prima di poter confermare...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!canConfirm}
          color={severity === 'error' ? 'error' : 'primary'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}