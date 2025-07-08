'use client'

import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Button,
  Paper,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { useRouter } from 'next/navigation'
import {
  ContentCut as CutIcon,
  Engineering as PrecisionIcon,
  Construction as FixtureIcon,
  ArrowBack,
  Info as InfoIcon
} from '@mui/icons-material'

export default function ControlloNumericoManagementPage() {
  const router = useRouter()

  const mockupSections = [
    {
      title: 'Parametri Lavorazione',
      icon: CutIcon,
      color: '#ff5722',
      description: 'Tempi e parametri processo CNC',
      plannedFields: [
        'Tempo programmazione',
        'Tempo setup macchina',
        'Tempo ciclo lavorazione',
        'Priorità lavorazione',
        'Macchine compatibili'
      ]
    },
    {
      title: 'Materiali e Tooling',
      icon: PrecisionIcon,
      color: '#3f51b5',
      description: 'Tipo materiale e utensili richiesti',
      plannedFields: [
        'Tipo materiale (Alluminio, Carbon Fiber, ecc.)',
        'Tooling richiesto',
        'Classe tolleranza',
        'Finitura superficiale',
        'Ispezioni richieste'
      ]
    },
    {
      title: 'Controlli Qualità',
      icon: FixtureIcon,
      color: '#009688',
      description: 'Controlli dimensionali e verifiche',
      plannedFields: [
        'Controlli dimensionali (JSON)',
        'Ispezioni richieste',
        'Standard qualità',
        'Punti di controllo',
        'Certificazioni richieste'
      ]
    }
  ]

  const exampleData = [
    {
      partNumber: '8G5350A001',
      description: 'Pannello fusoliera',
      materialType: 'CARBON_FIBER',
      toolingRequired: ['T12-6mm', 'T15-10mm'],
      toleranceClass: 'FINE',
      cycleTime: 35,
      programmingTime: 45
    },
    {
      partNumber: '8G5350D004',
      description: 'Nervatura alare',
      materialType: 'ALUMINUM',
      toolingRequired: ['T08-4mm', 'T12-6mm', 'T20-12mm'],
      toleranceClass: 'PRECISION',
      cycleTime: 55,
      programmingTime: 30
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="flex items-center gap-2">
          <CutIcon />
          Gestione Dati Reparto Controllo Numerico
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Preview - Configurazione parametri lavorazione CNC esistenti
        </Typography>
      </Box>

      {/* Development Alert */}
      <Card sx={{ 
        backgroundColor: '#ffe8e8', 
        border: '2px solid #ff5722',
        mb: 4
      }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              backgroundColor: '#ff5722', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <InfoIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#d84315' }}>
                🚧 Pagina in Sviluppo
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: '#e64a19' }}>
                Configurazione Reparto Controllo Numerico CNC
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Questa sezione è attualmente in fase di sviluppo. L'interfaccia completa per la gestione 
                dei parametri di lavorazione CNC, tooling e controlli qualità sarà disponibile 
                nelle prossime release.
              </Typography>
            </Box>
            
            <Alert severity="success" sx={{ maxWidth: 500 }}>
              <Typography variant="body2">
                <strong>Schema Database:</strong> La tabella <code>PartControlloNumerico</code> è già 
                stata implementata con tutti i campi necessari e pronta per l'integrazione.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Funzionalità Pianificate
        </Typography>
        <Grid container spacing={3}>
          {mockupSections.map((section) => (
            <Grid size={{ xs: 12, md: 4 }} key={section.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box className="flex items-start gap-3">
                    <section.icon 
                      sx={{ 
                        fontSize: 40, 
                        color: section.color,
                        mt: 0.5
                      }} 
                    />
                    <Box className="flex-1">
                      <Typography variant="h6" gutterBottom>
                        {section.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {section.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {section.plannedFields.map((field, idx) => (
                          <Chip 
                            key={idx}
                            label={field} 
                            size="small" 
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Example Data Preview */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Anteprima Dati Esempio
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part Number</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Tipo Materiale</TableCell>
                <TableCell>Tooling Richiesto</TableCell>
                <TableCell>Classe Tolleranza</TableCell>
                <TableCell>Tempo Ciclo (min)</TableCell>
                <TableCell>Tempo Programmazione (min)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exampleData.map((row) => (
                <TableRow key={row.partNumber}>
                  <TableCell>
                    <Chip label={row.partNumber} size="small" />
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>
                    <code>{row.materialType}</code>
                  </TableCell>
                  <TableCell>
                    {row.toolingRequired.map((tool, idx) => (
                      <Chip 
                        key={idx} 
                        label={tool} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>{row.toleranceClass}</TableCell>
                  <TableCell>{row.cycleTime}</TableCell>
                  <TableCell align="center">{row.programmingTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Database Schema Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Schema Database <code>PartControlloNumerico</code> (Esistente)
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto' 
          }}>
{`model PartControlloNumerico {
  id                 String          @id @default(cuid())
  partId             String          @unique
  materialType       CNCMaterialType // Alluminio, Carbon Fiber, etc
  toolingRequired    String[]        // Lista utensili
  programmingTime    Int?            // Tempo programmazione
  setupTime          Int?            // Tempo setup
  cycleTime          Int?            // Tempo ciclo
  toleranceClass     ToleranceClass  // Classe tolleranza
  surfaceFinish      String?         // Finitura superficiale
  compatibleMachines String[]        // Macchine compatibili
  priority           Int             // Priorità lavorazione
  dimensionalChecks  Json            // Controlli dimensionali
  requiredInspection String?         // Ispezioni richieste
  
  part               Part      @relation(...)
}`}
          </Typography>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/admin/departments')}
        >
          Torna a Gestione Reparti
        </Button>
      </Box>
    </Box>
  )
}