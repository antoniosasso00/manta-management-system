import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Container, Typography, Paper, Box, Link } from '@mui/material'
import NextLink from 'next/link'

export default function ResetPasswordPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reimposta Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Inserisci la tua nuova password
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <ResetPasswordForm />
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link component={NextLink} href="/login" variant="body2">
            Torna al Login
          </Link>
        </Box>
      </Paper>
    </Container>
  )
}