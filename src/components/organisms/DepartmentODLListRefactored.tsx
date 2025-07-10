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
  Badge
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
      {/* Header con statistiche */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              ODL Attivi
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {data.statistics.totalActive}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Tempo Medio Ciclo
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {data.statistics.avgCycleTime}
              <Typography component="span" variant="h6" color="text.secondary">
                {' '}min
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Efficienza
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={
              data.statistics.efficiency >= 90 ? 'success.main' :
              data.statistics.efficiency >= 70 ? 'warning.main' :
              'error.main'
            }>
              {data.statistics.efficiency}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Completati Oggi
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main">
              {data.odlCompleted.length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs per stato ODL con badge */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabConfig.map((tab, index) => (
            <Tab 
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{tab.label}</span>
                  <Badge 
                    badgeContent={tab.count} 
                    color={tab.color as any}
                    max={99}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        
        {/* Descrizione del tab corrente */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary">
            {currentTab.description}
          </Typography>
        </Box>
      </Paper>

      {/* Tabella/Card ODL */}
      <ODLDataTable
        odls={currentTab.data}
        department={{ 
          id: departmentId, 
          name: departmentName || '', 
          code: departmentCode 
        }}
        onAction={handleWorkflowAction}
        loading={loading}
        hasActionsInProgress={hasActionsInProgress}
        showStatusColumn={false} // Lo stato è già determinato dal tab
        enableAdvancedActions={userRole === 'ADMIN' || userRole === 'SUPERVISOR'}
      />

      {/* Dialog di conferma per azioni critiche */}
      <ConfirmActionDialog
        open={pendingAction !== null}
        title="Conferma Completamento ODL"
        message={
          <>
            <Typography variant="body1" gutterBottom>
              Stai per completare l'ODL <strong>{pendingAction?.odlNumber}</strong> nel reparto {departmentName}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              L'ODL verrà automaticamente trasferito al reparto successivo secondo il workflow configurato.
            </Typography>
          </>
        }
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
        severity="warning"
        confirmText="Completa e Trasferisci"
        cancelText="Annulla"
      />
    </Box>
  )
}