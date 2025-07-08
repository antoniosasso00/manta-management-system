'use client'

import { Box, Typography } from '@mui/material'
import Image from 'next/image'
import { useState, useEffect } from 'react'

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
  const [imageError, setImageError] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: 'h6' },
    medium: { width: 48, height: 48, fontSize: 'h5' },
    large: { width: 64, height: 64, fontSize: 'h4' }
  }

  const currentSize = sizeMap[size]

  const handleImageError = () => {
    console.error('Logo image failed to load from /manta-logo.svg')
    setImageError(true)
  }

  const LogoFallback = () => (
    <Box
      sx={{
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: '8px',
        backgroundColor: '#1976d2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size === 'small' ? '14px' : size === 'medium' ? '18px' : '22px'
      }}
    >
      MG
    </Box>
  )

  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        {!mounted || imageError ? (
          <LogoFallback />
        ) : (
          <Box
            component="img"
            src="/manta-logo.svg"
            alt="Manta Group Logo"
            sx={{
              width: currentSize.width,
              height: currentSize.height,
              display: 'block'
            }}
            onError={handleImageError}
          />
        )}
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
      {!mounted || imageError ? (
        <LogoFallback />
      ) : (
        <Box
          component="img"
          src="/manta-logo.svg"
          alt="Manta Group Logo"
          sx={{
            width: currentSize.width,
            height: currentSize.height,
            display: 'block'
          }}
          onError={handleImageError}
        />
      )}
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
            Gestione Produzione
          </Typography>
        </Box>
      )}
    </Box>
  )
}