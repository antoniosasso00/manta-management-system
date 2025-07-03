'use client'

import { Container, Typography, Box, Paper, Alert } from '@mui/material'
import { Brush } from '@mui/icons-material'

export default function VerniciaturaPag() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Brush sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Reparto Verniciatura
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestione processi di verniciatura e finishing
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Modulo in Sviluppo
          </Typography>
          <Typography variant="body2">
            Il modulo per la gestione del reparto Verniciatura è in fase di sviluppo.
            Le funzionalità principali includeranno:
          </Typography>
          <ul>
            <li>Gestione cicli verniciatura</li>
            <li>Controllo qualità superficie</li>
            <li>Gestione vernici e primer</li>
            <li>Monitoraggio cabine verniciatura</li>
            <li>Controllo spessori e adesione</li>
          </ul>
        </Alert>
      </Paper>
    </Container>
  )
}