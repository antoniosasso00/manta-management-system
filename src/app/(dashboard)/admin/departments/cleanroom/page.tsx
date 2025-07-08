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
  Layers as LayersIcon,
  Science as MaterialIcon,
  Timer as TimeIcon,
  ArrowBack,
  Info as InfoIcon
} from '@mui/icons-material'

export default function CleanroomManagementPage() {
  const router = useRouter()

  const mockupSections = [
    {
      title: 'Programmi di Laminazione',
      icon: LayersIcon,
      color: '#2196f3',
      description: 'Gestione sequenze layup e orientamento fibre',
      plannedFields: [
        'Sequenza strati composito (JSON)',
        'Orientamenti fibre [0°, 45°, 90°, -45°]',
        'Spessore totale laminato',
        'Tipo di laminazione (manuale/automatica)'
      ]
    },
    {
      title: 'Gestione Materiali',
      icon: MaterialIcon,
      color: '#4caf50',
      description: 'Configurazione prepreg, resine e adesivi',
      plannedFields: [
        'Codice prepreg',
        'Tipo resina',
        'Temperatura stoccaggio',
        'Umidità richiesta (%)',
        'Shelf life (giorni)',
        'Out time massimo'
      ]
    },
    {
      title: 'Parametri Processo',
      icon: TimeIcon,
      color: '#ff9800',
      description: 'Tempi e condizioni ambientali',
      plannedFields: [
        'Tempo setup (minuti)',
        'Tempo ciclo (minuti)',
        'Temperatura sala (°C)',
        'Umidità sala (%)',
        'Classe clean room richiesta'
      ]
    }
  ]

  const exampleData = [
    {
      partNumber: '8G5350A001',
      description: 'Pannello fusoliera',
      layupSequence: '[0/45/90/-45]s',
      resinType: 'Epoxy RTM6',
      prepregCode: 'HexPly M21',
      cycleTime: 180
    },
    {
      partNumber: '8G5350B002',
      description: 'Longherone alare',
      layupSequence: '[0/0/45/-45/90]s',
      resinType: 'BMI 5250-4',
      prepregCode: 'Cycom 5320',
      cycleTime: 240
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="flex items-center gap-2">
          <LayersIcon />
          Gestione Dati Reparto Clean Room
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Preview - Configurazione parametri laminazione e materiali compositi
        </Typography>
      </Box>

      {/* Development Alert */}
      <Card sx={{ 
        backgroundColor: '#fff3e0', 
        border: '2px solid #ff9800',
        mb: 4
      }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              backgroundColor: '#ff9800', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <InfoIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#e65100' }}>
                🚧 Pagina in Sviluppo
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: '#ef6c00' }}>
                Configurazione Reparto Clean Room
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Questa sezione è attualmente in fase di sviluppo. L'interfaccia completa per la gestione 
                dei parametri di laminazione, materiali compositi e sequenze layup sarà disponibile 
                nelle prossime release.
              </Typography>
            </Box>
            
            <Alert severity="warning" sx={{ maxWidth: 500 }}>
              <Typography variant="body2">
                <strong>Schema Database:</strong> La tabella <code>PartCleanroom</code> è già stata 
                implementata e pronta per l'integrazione con l'interfaccia utente.
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
                <TableCell>Sequenza Layup</TableCell>
                <TableCell>Tipo Resina</TableCell>
                <TableCell>Codice Prepreg</TableCell>
                <TableCell>Tempo Ciclo (min)</TableCell>
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
                    <code>{row.layupSequence}</code>
                  </TableCell>
                  <TableCell>{row.resinType}</TableCell>
                  <TableCell>{row.prepregCode}</TableCell>
                  <TableCell align="center">{row.cycleTime}</TableCell>
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
            Schema Database <code>PartCleanroom</code>
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto' 
          }}>
{`model PartCleanroom {
  id                String    @id @default(cuid())
  partId            String    @unique
  layupSequence     Json?     // Sequenza strati composito
  fiberOrientation  String[]  // Orientamenti fibre
  resinType         String?   // Tipo resina
  prepregCode       String?   // Codice prepreg
  roomTemperature   Float?    // Temperatura stanza
  humidity          Float?    // Umidità richiesta %
  shelfLife         Int?      // Vita utile in giorni
  setupTime         Int?      // Tempo setup minuti
  cycleTime         Int?      // Tempo ciclo minuti
  
  part              Part      @relation(...)
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