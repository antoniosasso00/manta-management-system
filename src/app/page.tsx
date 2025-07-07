import { Box, Typography } from '@mui/material'

export default function Home() {
  // Static page that never redirects - let middleware handle everything
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}
    >
      <Typography variant="h4">
        Manta Management System
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Access the application at /login or /dashboard
      </Typography>
    </Box>
  )
}