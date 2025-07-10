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
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(63, 81, 181, 0.05) 100%)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(25, 118, 210, 0.15)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                📊 ODL Attivi
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  📈
                </Typography>
              </Box>
            </Box>
            <Typography variant="h2" fontWeight={900} color="primary.main" sx={{ lineHeight: 1 }}>
              {data.statistics.totalActive}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              Ordini in produzione
            </Typography>
          </CardContent>
        </Card>

        {/* Tempo Medio Ciclo */}
        <Card sx={{
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.05) 100%)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(76, 175, 80, 0.15)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #388e3c 0%, #66bb6a 100%)'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                ⏱️ Tempo Medio
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
                <Typography variant="h6" color="success.main" fontWeight={700}>
                  ⚡
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="baseline" gap={0.5}>
              <Typography variant="h2" fontWeight={900} color="success.main" sx={{ lineHeight: 1 }}>
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
          borderRadius: 4,
          overflow: 'hidden',
          background: data.statistics.efficiency >= 90 
            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.05) 100%)'
            : data.statistics.efficiency >= 70
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(239, 154, 154, 0.05) 100%)',
          border: `1px solid ${
            data.statistics.efficiency >= 90 ? 'rgba(76, 175, 80, 0.2)' :
            data.statistics.efficiency >= 70 ? 'rgba(255, 152, 0, 0.2)' :
            'rgba(244, 67, 54, 0.2)'
          }`,
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: data.statistics.efficiency >= 90 
              ? '0 12px 24px rgba(76, 175, 80, 0.15)'
              : data.statistics.efficiency >= 70
              ? '0 12px 24px rgba(255, 152, 0, 0.15)'
              : '0 12px 24px rgba(244, 67, 54, 0.15)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: data.statistics.efficiency >= 90 
              ? 'linear-gradient(90deg, #388e3c 0%, #66bb6a 100%)'
              : data.statistics.efficiency >= 70
              ? 'linear-gradient(90deg, #f57c00 0%, #ffb74d 100%)'
              : 'linear-gradient(90deg, #d32f2f 0%, #ef5350 100%)'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                🎯 Efficienza
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: data.statistics.efficiency >= 90 
                  ? 'rgba(76, 175, 80, 0.1)'
                  : data.statistics.efficiency >= 70
                  ? 'rgba(255, 152, 0, 0.1)'
                  : 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" fontWeight={700} color={
                  data.statistics.efficiency >= 90 ? 'success.main' :
                  data.statistics.efficiency >= 70 ? 'warning.main' :
                  'error.main'
                }>
                  {data.statistics.efficiency >= 90 ? '🟢' : data.statistics.efficiency >= 70 ? '🟡' : '🔴'}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="baseline" gap={0.5}>
              <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1 }} color={
                data.statistics.efficiency >= 90 ? 'success.main' :
                data.statistics.efficiency >= 70 ? 'warning.main' :
                'error.main'
              }>
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
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(186, 104, 200, 0.05) 100%)',
          border: '1px solid rgba(156, 39, 176, 0.2)',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(156, 39, 176, 0.15)'
          }
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #7b1fa2 0%, #ab47bc 100%)'
          }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                ✅ Completati
              </Typography>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#7b1fa2' }} fontWeight={700}>
                  🎉
                </Typography>
              </Box>
            </Box>
            <Typography variant="h2" fontWeight={900} sx={{ color: '#7b1fa2', lineHeight: 1 }}>
              {data.odlCompleted.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
              ODL oggi
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs per stato ODL con badge - Enhanced Design */}
      <Card elevation={0} sx={{ 
        mb: 3, 
        borderRadius: 3,
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            '& .MuiTab-root': {
              minHeight: 72,
              py: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(63, 81, 181, 0.04)',
                transform: 'translateY(-2px)'
              },
              '&.Mui-selected': {
                bgcolor: 'rgba(63, 81, 181, 0.08)',
                color: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
              }
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          {tabConfig.map((tab, index) => (
            <Tab 
              key={index}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {tab.label}
                    </Typography>
                    <Chip
                      label={tab.count}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        minWidth: 32,
                        ...(tab.color === 'info' && {
                          bgcolor: 'rgba(25, 118, 210, 0.1)',
                          color: '#1976d2',
                          border: '1px solid rgba(25, 118, 210, 0.3)'
                        }),
                        ...(tab.color === 'warning' && {
                          bgcolor: 'rgba(255, 152, 0, 0.1)',
                          color: '#f57c00',
                          border: '1px solid rgba(255, 152, 0, 0.3)'
                        }),
                        ...(tab.color === 'success' && {
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          color: '#388e3c',
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }),
                        ...(tab.color === 'default' && {
                          bgcolor: 'rgba(158, 158, 158, 0.1)',
                          color: '#616161',
                          border: '1px solid rgba(158, 158, 158, 0.3)'
                        })
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.6875rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      maxWidth: 120,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {tab.description}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
        
        {/* Enhanced description panel */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.02) 0%, rgba(25, 118, 210, 0.01) 100%)',
          borderTop: '1px solid rgba(224, 224, 224, 0.3)'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                  {currentTab.label}
                </Typography>
                <Chip
                  label={`${currentTab.count} ODL`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    ...(currentTab.color === 'info' && {
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                      color: '#1976d2'
                    }),
                    ...(currentTab.color === 'warning' && {
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      color: '#f57c00'
                    }),
                    ...(currentTab.color === 'success' && {
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      color: '#388e3c'
                    }),
                    ...(currentTab.color === 'default' && {
                      bgcolor: 'rgba(158, 158, 158, 0.1)',
                      color: '#616161'
                    })
                  }}
                />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {currentTab.description}
            </Typography>
          </Box>
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