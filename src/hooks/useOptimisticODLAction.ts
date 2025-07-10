'use client'

import { useState, useCallback, useRef } from 'react'
import { EventType } from '@prisma/client'

interface OptimisticActionConfig {
  odlId: string
  departmentId: string
  eventType: EventType
  confirmationRequired?: boolean
}

interface OptimisticActionResult {
  success: boolean
  message: string
  autoTransfer?: {
    success: boolean
    message: string
    newStatus?: string
    nextDepartment?: {
      id: string
      name: string
      type: string
    }
  }
  warnings?: string[]
}

interface OptimisticUpdate {
  odlId: string
  action: EventType
  timestamp: Date
  status: 'pending' | 'success' | 'error'
}

interface UseOptimisticODLActionOptions {
  onSuccess?: (response: OptimisticActionResult) => void
  onError?: (error: Error) => void
  onRefresh?: () => void
}

export function useOptimisticODLAction(options: UseOptimisticODLActionOptions = {}) {
  const [pendingActions, setPendingActions] = useState<Map<string, OptimisticUpdate>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  const executeAction = useCallback(async (config: OptimisticActionConfig): Promise<OptimisticActionResult> => {
    const { odlId, departmentId, eventType, confirmationRequired = false } = config
    const actionId = `${odlId}-${eventType}-${Date.now()}`
    
    // Controlla se c'è già un'azione pendente per questo ODL
    const existingAction = Array.from(pendingActions.values()).find(
      action => action.odlId === odlId && action.status === 'pending'
    )
    
    if (existingAction) {
      console.warn('Azione già in corso per questo ODL, attendere...')
      return {
        success: false,
        message: 'Un\'altra operazione è già in corso per questo ODL',
        warnings: ['Attendere il completamento dell\'operazione in corso']
      }
    }

    // Cancella eventuali richieste precedenti
    const actionKey = `${odlId}-${eventType}`
    const existingController = abortControllers.current.get(actionKey)
    if (existingController) {
      existingController.abort()
    }

    // Crea nuovo AbortController
    const controller = new AbortController()
    abortControllers.current.set(actionKey, controller)

    // Aggiungi azione ottimistica
    setPendingActions(prev => new Map(prev).set(actionId, {
      odlId: odlId,
      action: eventType,
      timestamp: new Date(),
      status: 'pending'
    }))

    setIsProcessing(true)

    try {
      // Esegui chiamata API workflow unificata
      const response = await fetch('/api/workflow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odlId,
          departmentId,
          actionType: eventType,
          confirmationRequired
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Errore durante l\'operazione')
      }

      const data: OptimisticActionResult = await response.json()

      // Aggiorna stato a success
      setPendingActions(prev => {
        const updated = new Map(prev)
        const action = updated.get(actionId)
        if (action) {
          action.status = 'success'
        }
        return updated
      })

      // Callback success
      if (options.onSuccess) {
        options.onSuccess(data)
      }

      // Refresh dopo breve delay per dare feedback visivo
      if (options.onRefresh) {
        setTimeout(() => {
          options.onRefresh?.()
          // Rimuovi azione completata
          setPendingActions(prev => {
            const updated = new Map(prev)
            updated.delete(actionId)
            return updated
          })
        }, 500)
      }

      return data

    } catch (error) {
      // Ignora errori di abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Richiesta annullata:', actionKey)
        return {
          success: false,
          message: 'Operazione annullata'
        }
      }
      
      console.error('Errore azione ODL:', error)
      
      // Aggiorna stato a error
      setPendingActions(prev => {
        const updated = new Map(prev)
        const action = updated.get(actionId)
        if (action) {
          action.status = 'error'
        }
        return updated
      })

      // Callback error
      if (options.onError) {
        options.onError(error as Error)
      }

      // Rimuovi azione dopo delay
      setTimeout(() => {
        setPendingActions(prev => {
          const updated = new Map(prev)
          updated.delete(actionId)
          return updated
        })
      }, 3000)

      throw error

    } finally {
      setIsProcessing(false)
      // Cleanup abort controller
      abortControllers.current.delete(actionKey)
    }
  }, [pendingActions, options])

  // Funzione per verificare se un ODL ha azioni pendenti
  const hasActionsInProgress = useCallback((odlId: string) => {
    return Array.from(pendingActions.values()).some(
      action => action.odlId === odlId && action.status === 'pending'
    )
  }, [pendingActions])

  // Funzione per ottenere lo stato dell'ultima azione per un ODL
  const getActionStatus = useCallback((odlId: string) => {
    const actions = Array.from(pendingActions.values())
      .filter(action => action.odlId === odlId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return actions[0]?.status || null
  }, [pendingActions])

  // Cancella tutte le azioni in corso
  const cancelAllActions = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort())
    abortControllers.current.clear()
    setPendingActions(new Map())
  }, [])

  return {
    executeAction,
    hasActionsInProgress,
    getActionStatus,
    isProcessing,
    cancelAllActions,
    pendingActions: Array.from(pendingActions.values())
  }
}