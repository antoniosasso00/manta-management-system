'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
import { AccessTime as TimeIcon } from '@mui/icons-material'

interface SessionTimeoutProps {
  /** Timeout duration in minutes (default: 60) */
  timeoutMinutes?: number
  /** Warning time before timeout in minutes (default: 5) */
  warningMinutes?: number
  /** Whether to show countdown in warning dialog (default: true) */
  showCountdown?: boolean
}

export function SessionTimeout({
  timeoutMinutes = 60,
  warningMinutes = 5,
  showCountdown = true,
}: SessionTimeoutProps) {
  const { status } = useSession() // session currently unused
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isExtending, setIsExtending] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  
  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000

  const handleTimeout = useCallback(async () => {
    setShowWarning(false)
    await signOut({ callbackUrl: '/login?reason=timeout' })
  }, [])

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    
    setShowWarning(false)
    setCountdown(0)

    if (status === 'authenticated') {
      // Set warning timer
      warningRef.current = setTimeout(() => {
        setShowWarning(true)
        setCountdown(warningMinutes * 60) // Convert to seconds
        
        // Start countdown
        if (showCountdown) {
          countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                handleTimeout()
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      }, timeoutMs - warningMs)

      // Set timeout timer
      timeoutRef.current = setTimeout(() => {
        handleTimeout()
      }, timeoutMs)
    }
  }, [status, timeoutMs, warningMs, warningMinutes, showCountdown, handleTimeout])

  const handleExtendSession = async () => {
    setIsExtending(true)
    
    try {
      // Force session refresh to extend token
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        resetTimers()
      } else {
        await handleTimeout()
      }
    } catch (error) {
      console.error('Error extending session:', error)
      await handleTimeout()
    } finally {
      setIsExtending(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Activity detection
  useEffect(() => {
    const resetOnActivity = () => {
      if (status === 'authenticated' && !showWarning) {
        resetTimers()
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, resetOnActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetOnActivity, true)
      })
    }
  }, [status, showWarning, resetTimers])

  // Initialize timers when session is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      resetTimers()
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [status, resetTimers])

  // Don't render if not authenticated
  if (status !== 'authenticated') {
    return null
  }

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <TimeIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
        <Typography variant="h6">
          Sessione in Scadenza
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center">
          <Typography variant="body1" gutterBottom>
            La tua sessione scadrà a breve per motivi di sicurezza.
          </Typography>
          
          {showCountdown && countdown > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {formatTime(countdown)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(countdown / (warningMinutes * 60)) * 100}
                color="warning"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Clicca &quot;Estendi Sessione&quot; per continuare a lavorare o 
            &quot;Logout&quot; per uscire in sicurezza.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={handleTimeout}
          variant="outlined"
          disabled={isExtending}
        >
          Logout
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          disabled={isExtending}
          sx={{ ml: 2 }}
        >
          {isExtending ? 'Estendendo...' : 'Estendi Sessione'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}