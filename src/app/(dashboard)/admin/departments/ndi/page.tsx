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
  Scanner as ScannerIcon,
  Rule as CriteriaIcon,
  Engineering as CalibrationIcon,
  ArrowBack,
  Info as InfoIcon
} from '@mui/icons-material'

export default function NDIManagementPage() {
  const router = useRouter()

  const mockupSections = [
    {
      title: 'Metodologie di Controllo',
      icon: ScannerIcon,
      color: '#9c27b0',
      description: 'Definizione metodi NDI per tipo di part',
      plannedFields: [
        'Metodi ispezione (Ultrasuoni, Raggi X, Termografia)',
        'Parametri scansione',
        'Frequenze ultrasuoni',
        'Risoluzione imaging',
        'Aree critiche da ispezionare'
      ]
    },
    {
      title: 'Criteri di Accettazione',
      icon: CriteriaIcon,
      color: '#e91e63',
      description: 'Standard e limiti per difetti ammissibili',
      plannedFields: [
        'Dimensione massima difetto',
        'Numero difetti per area',
        'Profondità delaminazioni',
        'Porosità ammissibile (%)',
        'Criteri per classe di criticità'
      ]
    },
    {
      title: 'Calibrazione Strumenti',
      icon: CalibrationIcon,
      color: '#00bcd4',
      description: 'Requisiti calibrazione apparecchiature',
      plannedFields: [
        'Frequenza calibrazione',
        'Standard di riferimento',
        'Certificazioni operatore richieste',
        'Blocchi calibrazione',
        'Tolleranze strumentali'
      ]
    }
  ]

  const exampleData = [
    {
      partNumber: '8G5350A001',
      description: 'Pannello fusoliera',
      inspectionMethods: ['Ultrasuoni', 'Termografia'],
      maxDefectSize: '6mm',
      criticalAreas: 'Bordi, Fori passanti',
      inspectionTime: 45
    },
    {
      partNumber: '8G5350C003',
      description: 'Radome',
      inspectionMethods: ['Raggi X', 'Ultrasuoni'],
      maxDefectSize: '3mm',
      criticalAreas: 'Superficie interna',
      inspectionTime: 60
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="flex items-center gap-2">
          <ScannerIcon />
          Gestione Dati Reparto NDI
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Preview - Configurazione controlli non distruttivi e criteri di accettazione
        </Typography>
      </Box>

      {/* Development Alert */}
      <Card sx={{ 
        backgroundColor: '#f3e5f5', 
        border: '2px solid #9c27b0',
        mb: 4
      }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              backgroundColor: '#9c27b0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <InfoIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#6a1b9a' }}>
                🚧 Pagina in Sviluppo
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: '#8e24aa' }}>
                Configurazione Reparto NDI (Controlli Non Distruttivi)
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Questa sezione è attualmente in fase di sviluppo. L'interfaccia completa per la gestione 
                dei parametri di controllo non distruttivo, criteri di accettazione e calibrazione 
                strumenti sarà disponibile nelle prossime release.
              </Typography>
            </Box>
            
            <Alert severity="warning" sx={{ maxWidth: 500 }}>
              <Typography variant="body2">
                <strong>Schema Database:</strong> La tabella <code>PartNDI</code> è già stata 
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
                <TableCell>Metodi Ispezione</TableCell>
                <TableCell>Dimensione Max Difetto</TableCell>
                <TableCell>Aree Critiche</TableCell>
                <TableCell>Tempo Ispezione (min)</TableCell>
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
                    {row.inspectionMethods.map((method, idx) => (
                      <Chip 
                        key={idx} 
                        label={method} 
                        size="small" 
                        color="primary"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>{row.maxDefectSize}</TableCell>
                  <TableCell>{row.criticalAreas}</TableCell>
                  <TableCell align="center">{row.inspectionTime}</TableCell>
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
            Schema Database <code>PartNDI</code>
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto' 
          }}>
{`model PartNDI {
  id                String    @id @default(cuid())
  partId            String    @unique
  inspectionMethod  String[]  // Metodi: ultrasuoni, raggi X, termografia
  acceptanceCriteria Json?    // Criteri accettazione difetti
  criticalAreas     Json?     // Aree critiche da ispezionare
  inspectionTime    Int?      // Tempo ispezione in minuti
  requiredCerts     String[]  // Certificazioni richieste operatore
  calibrationReq    String?   // Requisiti calibrazione strumenti
  
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