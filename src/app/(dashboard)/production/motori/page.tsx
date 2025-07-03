'use client'

import { Container, Typography, Box, Paper, Alert } from '@mui/material'
import { DirectionsCar } from '@mui/icons-material'

export default function MotoriPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DirectionsCar sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Reparto Motori
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestione assemblaggio e test motori aeronautici
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Modulo in Sviluppo
          </Typography>
          <Typography variant="body2">
            Il modulo per la gestione del reparto Motori è in fase di sviluppo.
            Le funzionalità principali includeranno:
          </Typography>
          <ul>
            <li>Assemblaggio componenti motore</li>
            <li>Test bench e collaudi</li>
            <li>Controllo parametri prestazionali</li>
            <li>Tracciabilità componenti critici</li>
            <li>Certificazioni di volo</li>
          </ul>
        </Alert>
      </Paper>
    </Container>
  )
}