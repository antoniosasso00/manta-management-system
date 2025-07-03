'use client'

import { Container, Typography, Box, Paper } from '@mui/material'
import { UserManagement } from '@/components/auth/UserManagement'
import { useAuth } from '@/hooks/useAuth'

export default function AdminUsersPage() {
  const { user } = useAuth()

  // Controllo accesso admin
  if (user?.role !== 'ADMIN') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Accesso Negato
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Solo gli amministratori possono accedere a questa pagina.
          </Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestione Utenti
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci utenti del sistema, ruoli e permessi
        </Typography>
      </Box>
      
      <UserManagement />
    </Container>
  )
}