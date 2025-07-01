'use client'

import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { forwardRef, ReactNode } from 'react'

export interface LoadingButtonExtendedProps extends ButtonProps {
  loading?: boolean
  loadingIndicator?: ReactNode
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonExtendedProps>(
  ({ loading = false, loadingIndicator, disabled, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        startIcon={loading ? (loadingIndicator || <CircularProgress size={16} />) : props.startIcon}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'