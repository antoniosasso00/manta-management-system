'use client'

import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Skeleton,
  Alert,
  Snackbar
} from '@mui/material'
import { ODLCard } from '@/components/molecules'
import { ConfirmActionDialog } from '@/components/atoms'
import ManualStatusChanger from './ManualStatusChanger'
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
}

export function DepartmentODLList({ 
  departmentId,
  data, 
  loading = false,
  error,
  onTrackingEvent,
  onRefresh,
  departmentName,
  departmentCode
}: DepartmentODLListProps) {
  const [tabValue, setTabValue] = useState(0)
  const [pendingAction, setPendingAction] = useState<{ odlId: string; action: EventType } | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  })
  
  // Hook per gestire optimistic updates
  const { executeAction, hasActionsInProgress, getActionStatus } = useOptimisticODLAction({
    onSuccess: (response) => {
      // Gestisci feedback trasferimento automatico
      if (pendingAction?.action === 'EXIT' && response?.autoTransfer) {
        const transfer = response.autoTransfer
        if (transfer.success) {
          setSnackbar({
            open: true,
            message: transfer.message || 'ODL trasferito automaticamente al reparto successivo',
            severity: 'success'
          })
        } else {
          setSnackbar({
            open: true,
            message: transfer.message || 'Trasferimento automatico non riuscito. Procedere manualmente.',
            severity: 'warning'
          })
        }
      } else if (pendingAction?.action === 'PAUSE') {
        setSnackbar({
          open: true,
          message: 'ODL messo in pausa. Rimane nel reparto in attesa di ripresa.',
          severity: 'info'
        })
      } else if (pendingAction?.action === 'RESUME') {
        setSnackbar({
          open: true,
          message: 'ODL ripreso dalla pausa. Lavorazione ripristinata.',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: `Azione ${pendingAction?.action} completata con successo`,
          severity: 'success'
        })
      }
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Errore durante l\'operazione. Riprovare.',
        severity: 'error'
      })
    },
    onRefresh
  })

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAction = (odlId: string, action: EventType) => {
    setPendingAction({ odlId, action })
  }

  const confirmAction = async () => {
    if (!pendingAction) return

    try {
      // Usa l'hook optimistic per eseguire l'azione
      await executeAction({
        odlId: pendingAction.odlId,
        departmentId,
        eventType: pendingAction.action,
        confirmationRequired: true
      })
      
      setPendingAction(null)
    } catch (err) {
      // Errore già gestito dall'hook
      console.error('Errore durante l\'azione:', err)
    }
  }

  if (loading && !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Box key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Box>
          ))}
        </Box>
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

  const getTabContent = () => {
    switch (tabValue) {
      case 0:
        return data.odlIncoming || []
      case 1:
        return data.odlInPreparation
      case 2:
        return data.odlInProduction
      case 3:
        return data.odlCompleted
      default:
        return []
    }
  }

  const currentODLs = getTabContent()

  return (
    <Box>
      {/* Header con statistiche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              ODL Attivi
            </Typography>
            <Typography variant="h4">
              {data.statistics.totalActive}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Tempo Medio Ciclo
            </Typography>
            <Typography variant="h4">
              {data.statistics.avgCycleTime}m
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Efficienza
            </Typography>
            <Typography variant="h4">
              {data.statistics.efficiency}%
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs per stato ODL */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab 
            label={`ODL in Arrivo (${data.odlIncoming?.length || 0})`} 
            sx={{ color: 'info.main' }}
          />
          <Tab label={`${nomenclature.states.preparation.label} (${data.odlInPreparation.length})`} />
          <Tab label={`${nomenclature.states.inProcess.label} (${data.odlInProduction.length})`} />
          <Tab label={`${nomenclature.states.completed.label} (${data.odlCompleted.length})`} />
        </Tabs>
      </Box>

      {/* Lista ODL */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentODLs.length === 0 ? (
          <Box className="col-span-full">
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Nessun ODL in questo stato
              </Typography>
            </Paper>
          </Box>
        ) : (
          currentODLs.map((odl) => (
            <Box key={odl.id}>
              <ODLCard
                odl={odl}
                onAction={handleAction}
                loading={loading || hasActionsInProgress(odl.id)}
              />
              <ManualStatusChanger
                odl={odl}
                onStatusChanged={() => onRefresh?.()}
                departmentContext={departmentName}
              />
            </Box>
          ))
        )}
      </Box>

      {/* Dialog di conferma */}
      <ConfirmActionDialog
        open={pendingAction !== null}
        title="Conferma Azione"
        message={`Sei sicuro di voler procedere con questa azione? L'operazione verrà registrata nel sistema.`}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
        severity="warning"
      />
      
      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}