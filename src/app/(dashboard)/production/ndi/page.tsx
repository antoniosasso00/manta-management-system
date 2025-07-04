'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Grid,
  Button
} from '@mui/material'
import {
  Science,
  Construction,
  Info,
  Assignment,
  CheckCircle,
  Warning
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

export default function NDIPage() {
  const router = useRouter()

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Science />
          NDI - Controlli Non Distruttivi
        </Typography>
      </Box>

      {/* Development Notice */}
      <Alert severity="info" icon={<Construction />}>
        <Typography variant="h6" gutterBottom>
          Modulo NDI in Sviluppo
        </Typography>
        <Typography variant="body2">
          Il modulo per i controlli non distruttivi è in fase di implementazione e includerà:
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 8 }}>
          <li>Gestione protocolli di controllo per tipologia parte</li>
          <li>Registrazione risultati controlli (ultrasuoni, liquidi penetranti, etc.)</li>
          <li>Tracciamento certificazioni e conformità</li>
          <li>Interfaccia mobile per operatori NDI</li>
          <li>Report conformità e non conformità</li>
          <li>Integrazione con strumentazione NDI</li>
        </ul>
      </Alert>

      {/* Mockup Features */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center gap-2">
                <Assignment color="primary" />
                Gestione Protocolli
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Definizione protocolli di controllo specifici per tipologia e criticità dei componenti aerospaziali
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center gap-2">
                <CheckCircle color="success" />
                Registrazione Risultati
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Interfaccia per registrazione esiti controlli con foto, misurazioni e certificazioni di conformità
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center gap-2">
                <Warning color="warning" />
                Gestione Non Conformità
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Workflow per gestione difetti rilevati, decisioni su rilavorazioni e scarto materiale
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center gap-2">
                <Science color="secondary" />
                Integrazione Strumenti
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Connessione diretta con strumentazione NDI per acquisizione automatica dati di misura
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Technical Specifications */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom className="flex items-center gap-2">
            <Info />
            Specifiche Tecniche NDI
          </Typography>
          
          <Box className="space-y-3">
            <Typography variant="body1" fontWeight="bold">
              🔬 Tipologie di Controllo Supportate
            </Typography>
            <Box className="ml-4 space-y-1">
              <Typography variant="body2">• Controlli ultrasuoni (UT)</Typography>
              <Typography variant="body2">• Liquidi penetranti (PT)</Typography>
              <Typography variant="body2">• Particelle magnetiche (MT)</Typography>
              <Typography variant="body2">• Radiografia industriale (RT)</Typography>
              <Typography variant="body2">• Termografia (IRT)</Typography>
            </Box>

            <Typography variant="body1" fontWeight="bold">
              📋 Normative di Riferimento
            </Typography>
            <Box className="ml-4 space-y-1">
              <Typography variant="body2">• EN 4179 - Controlli NDI compositi aerospaziali</Typography>
              <Typography variant="body2">• ASTM E1444 - Prove magnetoscopiche</Typography>
              <Typography variant="body2">• ISO 3452 - Prove con liquidi penetranti</Typography>
              <Typography variant="body2">• AS9100 - Sistema qualità aerospaziale</Typography>
            </Box>

            <Typography variant="body1" fontWeight="bold">
              🎯 Integrazione Sistema Qualità
            </Typography>
            <Box className="ml-4 space-y-1">
              <Typography variant="body2">• Tracciabilità completa controlli per numero serie</Typography>
              <Typography variant="body2">• Generazione automatica certificati conformità</Typography>
              <Typography variant="body2">• Archiviazione digitale risultati e immagini</Typography>
              <Typography variant="body2">• Report statistici efficacia controlli</Typography>
            </Box>
          </Box>

          <Box className="mt-4">
            <Button 
              variant="outlined" 
              onClick={() => router.push('/production')}
            >
              Torna alla Produzione
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}