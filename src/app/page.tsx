'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Box, CircularProgress } from '@mui/material'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])
  
  // Show loading while checking auth
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}
    >
      <CircularProgress />
    </Box>
  )
}