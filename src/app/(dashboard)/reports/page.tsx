'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  Assessment,
  TrendingUp,
  Schedule,
  People,
  Factory,
  Download,
  PictureAsPdf,
  TableChart,
  Construction,
  Info
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ComponentType
  category: string
  color: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [reportPeriod, setReportPeriod] = useState('last_month')
  const [reportFormat, setReportFormat] = useState('pdf')

  const reportTypes: ReportType[] = [
    {
      id: 'production_overview',
      title: 'Overview Produzione',
      description: 'Report generale su volumi, tempi e efficienza produttiva',
      icon: TrendingUp,
      category: 'Produzione',
      color: '#2196f3'
    },
    {
      id: 'department_performance',
      title: 'Performance Dipartimenti',
      description: 'Analisi prestazioni per singolo reparto',
      icon: Factory,
      category: 'Produzione',
      color: '#ff9800'
    },
    {
      id: 'operator_productivity',
      title: 'Produttività Operatori',
      description: 'Report individuale sulle performance degli operatori',
      icon: People,
      category: 'Risorse Umane',
      color: '#9c27b0'
    },
    {
      id: 'cycle_times',
      title: 'Tempi di Ciclo',
      description: 'Analisi dettagliata dei tempi di lavorazione per reparto',
      icon: Schedule,
      category: 'Produzione',
      color: '#4caf50'
    },
    {
      id: 'quality_metrics',
      title: 'Metriche Qualità',
      description: 'Report su scarti, rilavorazioni e controlli qualità',
      icon: Assessment,
      category: 'Qualità',
      color: '#f44336'
    },
    {
      id: 'autoclave_optimization',
      title: 'Ottimizzazione Autoclavi',
      description: 'Efficienza batch e utilizzo autoclavi',
      icon: TrendingUp,
      category: 'Produzione',
      color: '#607d8b'
    }
  ]

  const handleGenerateReport = (report: ReportType) => {
    setSelectedReport(report)
    setGenerateDialogOpen(true)
  }

  const handleConfirmGenerate = () => {
    // Qui implementare la logica di generazione report
    setGenerateDialogOpen(false)
  }

  const groupedReports = reportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = []
    }
    acc[report.category].push(report)
    return acc
  }, {} as Record<string, ReportType[]>)

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Assessment />
          Centro Report
        </Typography>
      </Box>

      {/* Development Notice */}
      <Alert severity="info" icon={<Construction />}>
        <Typography variant="h6" gutterBottom>
          Sistema di Reportistica in Sviluppo
        </Typography>
        <Typography variant="body2">
          Il sistema di generazione report è in fase di implementazione. Le funzionalità disponibili includeranno:
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 8 }}>
          <li>Report produzione con dati real-time</li>
          <li>Analisi performance per dipartimento e operatore</li>
          <li>Export in formato PDF ed Excel</li>
          <li>Grafici e dashboard interattive</li>
          <li>Programmazione report automatici</li>
        </ul>
      </Alert>

      {/* Report Categories */}
      {Object.entries(groupedReports).map(([category, reports]) => (
        <Box key={category}>
          <Typography variant="h6" gutterBottom className="mb-4">
            {category}
          </Typography>
          <Grid container spacing={3}>
            {reports.map((report) => (
              <Grid item xs={12} sm={6} md={4} key={report.id}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea 
                    onClick={() => handleGenerateReport(report)}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent>
                      <Box className="text-center">
                        <report.icon 
                          sx={{ 
                            fontSize: 48, 
                            color: report.color, 
                            mb: 2 
                          }} 
                        />
                        <Typography variant="h6" component="h2" gutterBottom>
                          {report.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Recenti
          </Typography>
          <Box className="space-y-2">
            <Typography variant="body2" color="textSecondary">
              • Report Produzione Mensile - Giugno 2024 (generato 2 giorni fa)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Analisi Performance Clean Room - Settimana 26 (generato 5 giorni fa)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Report Efficienza Autoclavi - Q2 2024 (generato 1 settimana fa)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog 
        open={generateDialogOpen} 
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center gap-2">
          <Assessment />
          Genera Report: {selectedReport?.title}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              select
              fullWidth
              label="Periodo"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <MenuItem value="last_week">Ultima Settimana</MenuItem>
              <MenuItem value="last_month">Ultimo Mese</MenuItem>
              <MenuItem value="last_quarter">Ultimo Trimestre</MenuItem>
              <MenuItem value="custom">Periodo Personalizzato</MenuItem>
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Formato"
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
            >
              <MenuItem value="pdf">
                <Box className="flex items-center gap-2">
                  <PictureAsPdf />
                  PDF
                </Box>
              </MenuItem>
              <MenuItem value="excel">
                <Box className="flex items-center gap-2">
                  <TableChart />
                  Excel
                </Box>
              </MenuItem>
            </TextField>

            <Typography variant="body2" color="textSecondary">
              {selectedReport?.description}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={handleConfirmGenerate}
          >
            Genera Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}