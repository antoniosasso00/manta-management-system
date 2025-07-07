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

export default function RifilaturaManagementPage() {
  const router = useRouter()

  const mockupSections = [
    {
      title: 'Programmi CNC',
      icon: CutIcon,
      color: '#ff5722',
      description: 'Gestione percorsi utensile e parametri di taglio',
      plannedFields: [
        'Numero programma CNC',
        'Velocità taglio (mm/min)',
        'Avanzamento (mm/giro)',
        'Profondità passata',
        'Numero passate',
        'Tipo refrigerante'
      ]
    },
    {
      title: 'Utensili e Frese',
      icon: PrecisionIcon,
      color: '#3f51b5',
      description: 'Inventario utensili con vita utile',
      plannedFields: [
        'Lista utensili richiesti',
        'Diametro frese',
        'Materiale utensile',
        'Rivestimento',
        'Ore utilizzo massime',
        'Velocità rotazione (RPM)'
      ]
    },
    {
      title: 'Attrezzature e Dime',
      icon: FixtureIcon,
      color: '#009688',
      description: 'Fixture e riferimenti dimensionali',
      plannedFields: [
        'Codice dima/fixture',
        'Punti riferimento',
        'Classe tolleranza',
        'Sistema bloccaggio',
        'Controlli dimensionali',
        'Setup time attrezzatura'
      ]
    }
  ]

  const exampleData = [
    {
      partNumber: '8G5350A001',
      description: 'Pannello fusoliera',
      cncProgram: 'PRG-001',
      toolingList: ['T12-6mm', 'T15-10mm'],
      cuttingSpeed: 1200,
      tolerance: '±0.1mm',
      machineTime: 35
    },
    {
      partNumber: '8G5350D004',
      description: 'Nervatura alare',
      cncProgram: 'PRG-045',
      toolingList: ['T08-4mm', 'T12-6mm', 'T20-12mm'],
      cuttingSpeed: 800,
      tolerance: '±0.05mm',
      machineTime: 55
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="flex items-center gap-2">
          <CutIcon />
          Gestione Dati Reparto Rifilatura
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Mockup - Configurazione programmi CNC e parametri di lavorazione
        </Typography>
      </Box>

      {/* Status Alert */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="body2">
          <strong>Stato: Mockup</strong> - Questa è una preview della futura gestione dati Rifilatura.
          La tabella <code>PartRifilatura</code> è stata creata nel database ma l'interfaccia completa 
          sarà implementata in una fase successiva.
        </Typography>
      </Alert>

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
                <TableCell>Programma CNC</TableCell>
                <TableCell>Utensili</TableCell>
                <TableCell>Velocità Taglio</TableCell>
                <TableCell>Tolleranza</TableCell>
                <TableCell>Tempo Macchina (min)</TableCell>
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
                    <code>{row.cncProgram}</code>
                  </TableCell>
                  <TableCell>
                    {row.toolingList.map((tool, idx) => (
                      <Chip 
                        key={idx} 
                        label={tool} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>{row.cuttingSpeed} mm/min</TableCell>
                  <TableCell>{row.tolerance}</TableCell>
                  <TableCell align="center">{row.machineTime}</TableCell>
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
            Schema Database <code>PartRifilatura</code>
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto' 
          }}>
{`model PartRifilatura {
  id                String    @id @default(cuid())
  partId            String    @unique
  cncProgram        String?   // Numero programma CNC
  toolingList       String[]  // Lista utensili richiesti
  cuttingSpeed      Float?    // Velocità taglio mm/min
  feedRate          Float?    // Avanzamento mm/giro
  toleranceClass    String?   // Classe tolleranza
  fixtureCode       String?   // Codice dima/attrezzatura
  setupTime         Int?      // Tempo setup in minuti
  machineTime       Int?      // Tempo macchina in minuti
  
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