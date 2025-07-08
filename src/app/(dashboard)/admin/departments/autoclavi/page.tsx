'use client'

import { Box, Card, CardContent, Typography, Grid, Button } from '@mui/material'
import { useRouter } from 'next/navigation'
import {
  Build as AutoclaveIcon,
  Schedule as CycleIcon,
  Settings as ConfigIcon,
  Assessment as ReportIcon
} from '@mui/icons-material'

export default function AutoclaviManagementPage() {
  const router = useRouter()

  const sections = [
    {
      title: 'Gestione Autoclavi',
      description: 'Configura gli autoclavi fisici disponibili nel reparto',
      icon: AutoclaveIcon,
      href: '/dashboard/admin/departments/autoclavi/autoclaves',
      color: '#ff5722',
      stats: 'Dimensioni, linee vuoto, stato'
    },
    {
      title: 'Cicli di Cura',
      description: 'Gestisci i programmi di cura con temperature e pressioni',
      icon: CycleIcon,
      href: '/dashboard/admin/departments/autoclavi/cure-programs',
      color: '#2196f3',
      stats: 'Fasi, durate, parametri'
    },
    {
      title: 'Configurazione Part',
      description: 'Associa part number a cicli di cura e valvole richieste',
      icon: ConfigIcon,
      href: '/dashboard/admin/departments/autoclavi/part-config',
      color: '#4caf50',
      stats: 'Cicli, valvole, setup time'
    },
    {
      title: 'Report e Statistiche',
      description: 'Visualizza utilizzo autoclavi e efficienza cicli',
      icon: ReportIcon,
      href: '/dashboard/admin/departments/autoclavi/reports',
      color: '#9c27b0',
      stats: 'Coming soon'
    }
  ]

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="flex items-center gap-2">
          <AutoclaveIcon />
          Gestione Dati Reparto Autoclavi
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Configurazione parametri e dati supplementari per l&apos;ottimizzazione del reparto autoclavi
        </Typography>
      </Box>

      {/* Section Cards */}
      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid size={{ xs: 12, sm: 6 }} key={section.title}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: section.href !== '#' ? 'pointer' : 'default',
                opacity: section.stats === 'Coming soon' ? 0.7 : 1,
                '&:hover': section.href !== '#' ? {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                } : {}
              }}
              onClick={() => section.href !== '#' && router.push(section.href)}
            >
              <CardContent>
                <Box className="flex items-start gap-3">
                  <section.icon 
                    sx={{ 
                      fontSize: 48, 
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
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'inline-block',
                        mt: 1,
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'grey.100',
                        borderRadius: 1
                      }}
                    >
                      {section.stats}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/dashboard/admin/departments')}
        >
          ← Torna a Gestione Reparti
        </Button>
      </Box>
    </Box>
  )
}