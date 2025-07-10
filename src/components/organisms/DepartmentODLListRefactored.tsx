'use client'

import { useState, useMemo } from 'react'
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Skeleton,
  Alert,
  Chip,
  Badge,
  Card,
  CardContent
} from '@mui/material'
import { ODLDataTable } from './ODLDataTable'
import { ConfirmActionDialog } from '@/components/atoms'
import { DepartmentODLList as DepartmentODLListType, CreateManualEvent } from '@/domains/production'
import { EventType } from '@prisma/client'
import { getDepartmentNomenclature } from '@/config/departmentNomenclature'
import { useOptimisticODLAction } from '@/hooks/useOptimisticODLAction'

interface DepartmentODLListProps {
  departmentId: string
  data?: DepartmentODLListType
  loading?: boolean
  error?: string
  onTrackingEvent: (data: CreateManualEvent) => Promise<void>
  onRefresh?: () => void
  departmentName?: string
  departmentCode: string
  userRole?: string
}

export function DepartmentODLListRefactored({ 
  departmentId,
  data, 
  loading = false,
  error,
  onTrackingEvent,
  onRefresh,
  departmentName,
  departmentCode,
  userRole
}: DepartmentODLListProps) {
  const [tabValue, setTabValue] = useState(0)
  const [pendingAction, setPendingAction] = useState<{ 
    odlId: string; 
    action: EventType;
    odlNumber?: string;
  } | null>(null)
  
  // Hook per gestire optimistic updates
  const { executeAction, hasActionsInProgress, getActionStatus } = useOptimisticODLAction({
    onSuccess: (response) => {
      // Feedback gestito dal componente ODLDataTable
    },
    onError: (error) => {
      // Errore gestito dal componente ODLDataTable
    },
    onRefresh
  })

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleWorkflowAction = async (odlId: string, action: EventType, odlNumber?: string) => {
    // Per azioni critiche (EXIT), richiedi conferma
    if (action === 'EXIT') {
      setPendingAction({ odlId, action, odlNumber })
      return
    }
    
    // Per altre azioni, esegui direttamente
    try {
      await executeAction({
        odlId,
        departmentId,
        eventType: action,
        confirmationRequired: false
      })
    } catch (err) {
      console.error('Errore durante l\'azione:', err)
    }
  }

  const confirmAction = async () => {
    if (!pendingAction) return

    try {
      await executeAction({
        odlId: pendingAction.odlId,
        departmentId,
        eventType: pendingAction.action,
        confirmationRequired: true
      })
      
      setPendingAction(null)
    } catch (err) {
      console.error('Errore durante l\'azione:', err)
    }
  }

  if (loading && !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!data) return null

  const nomenclature = getDepartmentNomenclature(departmentCode)

  // Configurazione tab con badge e colori
  const tabConfig = [
    {
      label: 'In Arrivo',
      count: data.odlIncoming?.length || 0,
      data: data.odlIncoming || [],
      color: 'info',
      description: 'ODL trasferiti da altri reparti in attesa di presa in carico'
    },
    {
      label: nomenclature.states.preparation.label,
      count: data.odlInPreparation.length,
      data: data.odlInPreparation,
      color: 'warning',
      description: 'ODL in fase di preparazione/setup'
    },
    {
      label: nomenclature.states.inProcess.label,
      count: data.odlInProduction.length,
      data: data.odlInProduction,
      color: 'success',
      description: 'ODL attualmente in lavorazione'
    },
    {
      label: nomenclature.states.completed.label,
      count: data.odlCompleted.length,
      data: data.odlCompleted,
      color: 'default',
      description: 'ODL completati nelle ultime 24 ore'
    }
  ]

  const currentTab = tabConfig[tabValue]

  return (
    <Box>
      {/* Header con statistiche - Enhanced Design */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        {/* ODL Attivi */}
        <Card sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(55, 71, 79, 0.04)',
          border: '1px solid rgba(55, 71, 79, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#37474f'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                ODL Attivi
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(55, 71, 79, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#37474f' }} fontWeight={700}>
                  #
                </Typography>
              </Box>
            </Box>
            <Typography variant="h2" fontWeight={900} sx={{ color: '#37474f', lineHeight: 1 }}>
              {data.statistics.totalActive}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              Ordini in produzione
            </Typography>
          </CardContent>
        </Card>

        {/* Tempo Medio Ciclo */}
        <Card sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(55, 71, 79, 0.04)',
          border: '1px solid rgba(55, 71, 79, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#546e7a'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Tempo Medio
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(84, 110, 122, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#546e7a' }} fontWeight={700}>
                  T
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="baseline" gap={0.5}>
              <Typography variant="h2" fontWeight={900} sx={{ color: '#546e7a', lineHeight: 1 }}>
                {data.statistics.avgCycleTime}
              </Typography>
              <Typography variant="h5" color="text.secondary" fontWeight={600}>
                min
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              Per ciclo completo
            </Typography>
          </CardContent>
        </Card>

        {/* Efficienza */}
        <Card sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(55, 71, 79, 0.04)',
          border: '1px solid rgba(55, 71, 79, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: data.statistics.efficiency >= 90 ? '#4caf50' :
                     data.statistics.efficiency >= 70 ? '#f57c00' : '#f44336'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Efficienza
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(55, 71, 79, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#37474f' }} fontWeight={700}>
                  %
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="baseline" gap={0.5}>
              <Typography variant="h2" fontWeight={900} sx={{ 
                lineHeight: 1,
                color: data.statistics.efficiency >= 90 ? '#4caf50' :
                       data.statistics.efficiency >= 70 ? '#f57c00' : '#f44336'
              }}>
                {data.statistics.efficiency}
              </Typography>
              <Typography variant="h5" color="text.secondary" fontWeight={600}>
                %
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              Performance reparto
            </Typography>
          </CardContent>
        </Card>

        {/* Completati Oggi */}
        <Card sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(55, 71, 79, 0.04)',
          border: '1px solid rgba(55, 71, 79, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#4caf50'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Completati
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#4caf50' }} fontWeight={700}>
                  ✓
                </Typography>
              </Box>
            </Box>
            <Typography variant="h2" fontWeight={900} sx={{ color: '#4caf50', lineHeight: 1 }}>
              {data.odlCompleted.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              ODL oggi
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs per stato ODL - Professional Design */}
      <Card elevation={0} sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{ 
            bgcolor: '#fafafa',
            '& .MuiTab-root': {
              minHeight: 64,
              py: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#666',
              '&:hover': {
                bgcolor: 'rgba(55, 71, 79, 0.04)',
                color: '#37474f'
              },
              '&.Mui-selected': {
                bgcolor: 'white',
                color: '#37474f'
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              bgcolor: '#37474f'
            }
          }}
        >
          {tabConfig.map((tab, index) => (
            <Tab 
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {tab.label}
                  </Typography>
                  <Chip
                    label={tab.count}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minWidth: 28,
                      bgcolor: 'rgba(55, 71, 79, 0.08)',
                      color: '#37474f'
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        
        {/* Simple description panel */}
        <Box sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Typography variant="body2" color="text.secondary">
            {currentTab.description}
          </Typography>
        </Box>
      </Card>

      {/* Tabella/Card ODL */}
      <ODLDataTable
        odls={currentTab.data}
        departmentCode={departmentCode}
        onAction={handleWorkflowAction}
        loading={loading}
        onAdvancedWorkflow={(odl) => {
          // TODO: Implementare workflow avanzato
          console.log('Advanced workflow for:', odl.id);
        }}
      />

      {/* Dialog di conferma per azioni critiche */}
      <ConfirmActionDialog
        open={pendingAction !== null}
        title="Conferma Completamento ODL"
        message={`Stai per completare l'ODL ${pendingAction?.odlNumber} nel reparto ${departmentName}. L'ODL verrà automaticamente trasferito al reparto successivo secondo il workflow configurato.`}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
        severity="warning"
        confirmText="Completa e Trasferisci"
        cancelText="Annulla"
      />
    </Box>
  )
}