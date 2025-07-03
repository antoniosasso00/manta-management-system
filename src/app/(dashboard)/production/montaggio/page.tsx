'use client'

import { Container, Typography, Box, Paper, Alert } from '@mui/material'
import { HomeRepairService } from '@mui/icons-material'

export default function MontaggioPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <HomeRepairService sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Reparto Montaggio
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestione assemblaggi e montaggi finali
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Modulo in Sviluppo
          </Typography>
          <Typography variant="body2">
            Il modulo per la gestione del reparto Montaggio è in fase di sviluppo.
            Le funzionalità principali includeranno:
          </Typography>
          <ul>
            <li>Pianificazione sequenze di montaggio</li>
            <li>Gestione distinte base</li>
            <li>Controllo assemblaggio componenti</li>
            <li>Tracciabilità parti utilizzate</li>
            <li>Test funzionali finali</li>
          </ul>
        </Alert>
      </Paper>
    </Container>
  )
}