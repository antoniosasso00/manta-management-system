'use client'

import { Card as MuiCard, CardProps as MuiCardProps, CardContent, CardActions } from '@mui/material'
import { ReactNode } from 'react'

export interface CardProps extends MuiCardProps {
  children: ReactNode
  actions?: ReactNode
}

export function Card({ children, actions, ...props }: CardProps) {
  return (
    <MuiCard {...props}>
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  )
}