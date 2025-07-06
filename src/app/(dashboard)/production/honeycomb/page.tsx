'use client'

import { Container, Paper, Typography, Box, Alert, Chip } from '@mui/material'
import { Construction, Hexagon } from '@mui/icons-material'

export default function HoneycombPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reparto Honeycomb
        </Typography>
        <Chip 
          icon={<Hexagon />} 
          label="Preparazione Nuclei Alveolari" 
          color="primary" 
          sx={{ mb: 2 }}
        />
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Construction sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Funzionalità in Sviluppo
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Il modulo per la gestione del reparto Honeycomb è attualmente in fase di sviluppo.
        </Typography>

        <Alert severity="info" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2">
            <strong>Prossime funzionalità:</strong>
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', mt: 1 }}>
            <li>Gestione tipologie di nuclei (Aluminum, Nomex, Carbon)</li>
            <li>Tracciamento configurazioni honeycomb per parte</li>
            <li>Calcolo tempi di setup e lavorazione</li>
            <li>Controllo qualità adesione e resistenza</li>
            <li>Integrazione con flusso produttivo principale</li>
          </Box>
        </Alert>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Nota: Il reparto Honeycomb gestisce la preparazione dei nuclei alveolari per componenti sandwich 
            in composito, un processo separato dal flusso produttivo principale.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}