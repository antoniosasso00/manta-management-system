import { Box, Typography } from '@mui/material'
import Image from 'next/image'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  variant?: 'icon' | 'full'
  sx?: any
}

export function Logo({ 
  size = 'medium', 
  showText = true, 
  variant = 'full',
  sx = {} 
}: LogoProps) {
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: 'h6' },
    medium: { width: 48, height: 48, fontSize: 'h5' },
    large: { width: 64, height: 64, fontSize: 'h4' }
  }

  const currentSize = sizeMap[size]

  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <Image
          src="/android-chrome-192x192.png"
          alt="Manta Group Logo"
          width={currentSize.width}
          height={currentSize.height}
          priority
        />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: showText ? 2 : 0,
      ...sx 
    }}>
      <Image
        src="/android-chrome-192x192.png"
        alt="Manta Group Logo"
        width={currentSize.width}
        height={currentSize.height}
        priority
      />
      {showText && (
        <Box>
          <Typography 
            variant={currentSize.fontSize as any}
            component="span"
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              lineHeight: 1.2
            }}
          >
            Manta Group
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              fontSize: size === 'small' ? '0.75rem' : '0.875rem'
            }}
          >
            MES Aerospazio
          </Typography>
        </Box>
      )}
    </Box>
  )
}