'use client'

import { Box, Card, CardContent, Typography, Grid, Chip, Button } from '@mui/material'
import { useRouter } from 'next/navigation'
import {
  Build,
  Layers,
  Scanner,
  ContentCut,
  Factory,
  ArrowBack
} from '@mui/icons-material'

export default function DepartmentsIndexPage() {
  const router = useRouter()

  const departments = [
    {
      code: 'AUTOCLAVE',
      name: 'Autoclavi',
      description: 'Gestione cicli di cura, autoclavi e configurazioni part',
      icon: Build,
      color: '#ff5722',
      href: '/dashboard/admin/departments/autoclavi',
      status: 'active',
      features: ['Cicli di cura', 'Autoclavi fisici', 'Config Part-Autoclave']
    },
    {
      code: 'CLEANROOM',
      name: 'Clean Room',
      description: 'Configurazione laminazione e materiali compositi',
      icon: Layers,
      color: '#2196f3',
      href: '/dashboard/admin/departments/cleanroom',
      status: 'mockup',
      features: ['Sequenze layup', 'Materiali', 'Parametri processo']
    },
    {
      code: 'NDI',
      name: 'NDI',
      description: 'Controlli non distruttivi e criteri accettazione',
      icon: Scanner,
      color: '#9c27b0',
      href: '/dashboard/admin/departments/ndi',
      status: 'mockup',
      features: ['Metodi ispezione', 'Criteri difetti', 'Calibrazioni']
    },
    {
      code: 'RIFILATURA',
      name: 'Rifilatura',
      description: 'Programmi CNC e parametri lavorazione',
      icon: ContentCut,
      color: '#4caf50',
      href: '/dashboard/admin/departments/rifilatura',
      status: 'mockup',
      features: ['Programmi CNC', 'Utensili', 'Tolleranze']
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="h4" className="flex items-center gap-2">
            <Factory />
            Gestione Dati Reparti
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Configurazione dati supplementari per l'ottimizzazione di ogni reparto
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/admin')}
        >
          Torna Admin
        </Button>
      </Box>

      {/* Department Cards */}
      <Grid container spacing={3}>
        {departments.map((dept) => (
          <Grid size={{ xs: 12, sm: 6 }} key={dept.code}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => router.push(dept.href)}
            >
              <CardContent>
                <Box className="flex items-start gap-3">
                  <dept.icon 
                    sx={{ 
                      fontSize: 48, 
                      color: dept.color,
                      mt: 0.5
                    }} 
                  />
                  <Box className="flex-1">
                    <Box className="flex items-center gap-2 mb-1">
                      <Typography variant="h6">
                        {dept.name}
                      </Typography>
                      <Chip 
                        label={dept.status === 'active' ? 'Attivo' : 'Mockup'} 
                        size="small"
                        color={dept.status === 'active' ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {dept.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {dept.features.map((feature, idx) => (
                        <Chip 
                          key={idx}
                          label={feature} 
                          size="small" 
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
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

      {/* Info Box */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Informazioni Sistema
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Le pagine di gestione dati permettono di configurare i parametri supplementari 
            necessari per l'ottimizzazione automatica di ogni reparto. I dati configurati 
            vengono utilizzati dal microservizio di ottimizzazione per calcolare i batch 
            ottimali e pianificare la produzione.
          </Typography>
          <Typography variant="body2">
            <strong>Reparti Attivi:</strong> Completamente implementati e funzionanti<br/>
            <strong>Reparti Mockup:</strong> Preview delle funzionalità future
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}