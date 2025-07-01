'use client'

import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import { forwardRef } from 'react'

export interface ButtonProps extends MuiButtonProps {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, disabled, children, ...props }, ref) => {
    return (
      <MuiButton
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </MuiButton>
    )
  }
)

Button.displayName = 'Button'