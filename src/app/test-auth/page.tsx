'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Box, Button, Typography, Paper } from '@mui/material'

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  console.log('[TEST AUTH PAGE] Session:', session)
  console.log('[TEST AUTH PAGE] Status:', status)

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Test Auth Page
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Status: {status}
        </Typography>
        
        {status === 'authenticated' && session && (
          <Box sx={{ mt: 2 }}>
            <Typography>Email: {session.user?.email}</Typography>
            <Typography>Name: {session.user?.name}</Typography>
            <Typography>Role: {session.user?.role}</Typography>
            <Button 
              variant="contained" 
              onClick={() => signOut()}
              sx={{ mt: 2 }}
            >
              Sign Out
            </Button>
          </Box>
        )}
        
        {status === 'unauthenticated' && (
          <Box sx={{ mt: 2 }}>
            <Typography>Not authenticated</Typography>
            <Button 
              variant="contained" 
              onClick={() => signIn()}
              sx={{ mt: 2 }}
            >
              Sign In
            </Button>
          </Box>
        )}
        
        {status === 'loading' && (
          <Typography>Loading...</Typography>
        )}
      </Paper>
    </Box>
  )
}