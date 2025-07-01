import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Container, Typography, Paper, Box, Link } from '@mui/material'
import NextLink from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recupera Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Inserisci il tuo indirizzo email per ricevere le istruzioni per reimpostare la password
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <ForgotPasswordForm />
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link component={NextLink} href="/login" variant="body2">
            Torna al Login
          </Link>
        </Box>
      </Paper>
    </Container>
  )
}