'use client'

import { Container, Typography, Box, Paper, Alert } from '@mui/material'
import { Precision } from '@mui/icons-material'

export default function ControlloNumericoPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Precision sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Controllo Numerico
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestione macchine CNC e lavorazioni di precisione
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Modulo in Sviluppo
          </Typography>
          <Typography variant="body2">
            Il modulo per la gestione del Controllo Numerico è in fase di sviluppo.
            Le funzionalità principali includeranno:
          </Typography>
          <ul>
            <li>Programmazione macchine CNC</li>
            <li>Gestione utensili e attrezzature</li>
            <li>Controllo qualità dimensionale</li>
            <li>Monitoraggio tempi ciclo</li>
            <li>Manutenzione preventiva</li>
          </ul>
        </Alert>
      </Paper>
    </Container>
  )
}