import { Container, ContainerProps } from '@mui/material'
import { ReactNode } from 'react'

interface ResponsiveContainerProps extends Omit<ContainerProps, 'children'> {
  children: ReactNode
  mobileGutters?: boolean
}

export function ResponsiveContainer({ 
  children, 
  mobileGutters = true,
  sx,
  maxWidth = 'xl',
  ...props 
}: ResponsiveContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        px: mobileGutters ? { xs: 2, sm: 3 } : undefined,
        py: { xs: 2, sm: 3, md: 4 },
        ...sx
      }}
      {...props}
    >
      {children}
    </Container>
  )
}