'use client'

import { Box, Stepper, Step, StepLabel, StepIcon, Typography, Chip } from '@mui/material'
import { 
  CheckCircle, 
  RadioButtonUnchecked,
  Factory
} from '@mui/icons-material'
import { ODLStatus } from '@prisma/client'

interface WorkflowProgressProps {
  currentStatus: ODLStatus
  compact?: boolean
}

// Definizione workflow sequenziale aerospazio
const WORKFLOW_STEPS = [
  { status: 'IN_CLEANROOM', label: 'Clean Room', completed: 'CLEANROOM_COMPLETED' },
  { status: 'IN_AUTOCLAVE', label: 'Autoclavi', completed: 'AUTOCLAVE_COMPLETED' },
  { status: 'IN_CONTROLLO_NUMERICO', label: 'CNC', completed: 'CONTROLLO_NUMERICO_COMPLETED' },
  { status: 'IN_NDI', label: 'NDI', completed: 'NDI_COMPLETED' },
  { status: 'IN_MONTAGGIO', label: 'Montaggio', completed: 'MONTAGGIO_COMPLETED' },
  { status: 'IN_VERNICIATURA', label: 'Verniciatura', completed: 'VERNICIATURA_COMPLETED' },
  { status: 'IN_CONTROLLO_QUALITA', label: 'Controllo Qualità', completed: 'CONTROLLO_QUALITA_COMPLETED' },
  { status: 'COMPLETED', label: 'Completato', completed: 'COMPLETED' }
]

export function WorkflowProgress({ currentStatus, compact = false }: WorkflowProgressProps) {
  // Determina lo step attuale
  const getCurrentStep = () => {
    const index = WORKFLOW_STEPS.findIndex(
      step => step.status === currentStatus || step.completed === currentStatus
    )
    return index !== -1 ? index : -1
  }

  const currentStep = getCurrentStep()

  // Determina se uno step è completato
  const isStepCompleted = (index: number) => {
    if (index < currentStep) return true
    if (index === currentStep && WORKFLOW_STEPS[index].completed === currentStatus) return true
    return false
  }

  // Determina se uno step è attivo
  const isStepActive = (index: number) => {
    return index === currentStep && WORKFLOW_STEPS[index].status === currentStatus
  }

  if (compact) {
    // Versione compatta per card
    const nextStep = currentStep < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentStep + 1] : null
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Percorso Workflow
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            Step {currentStep + 1} di {WORKFLOW_STEPS.length}
          </Typography>
          {nextStep && (
            <>
              <Typography variant="body2" color="text.secondary">→</Typography>
              <Chip 
                size="small" 
                label={`Prossimo: ${nextStep.label}`}
                color="primary"
                variant="outlined"
              />
            </>
          )}
          {currentStatus === 'COMPLETED' && (
            <Chip 
              size="small" 
              label="Workflow Completato"
              color="success"
              icon={<CheckCircle />}
            />
          )}
        </Box>
      </Box>
    )
  }

  // Versione estesa
  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Factory color="primary" />
        Percorso di Produzione
      </Typography>
      
      <Stepper activeStep={currentStep} alternativeLabel sx={{ mt: 2 }}>
        {WORKFLOW_STEPS.map((step, index) => {
          const completed = isStepCompleted(index)
          const active = isStepActive(index)
          
          return (
            <Step key={step.status} completed={completed}>
              <StepLabel
                StepIconComponent={() => (
                  <StepIcon
                    active={active}
                    completed={completed}
                    icon={
                      completed ? (
                        <CheckCircle color="success" />
                      ) : (
                        <RadioButtonUnchecked color={active ? 'primary' : 'disabled'} />
                      )
                    }
                  />
                )}
              >
                <Typography 
                  variant="body2" 
                  color={active ? 'primary' : completed ? 'text.primary' : 'text.secondary'}
                  sx={{ fontWeight: active ? 600 : 400 }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>
      
      {/* Info prossimo step */}
      {currentStep < WORKFLOW_STEPS.length - 1 && currentStep >= 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {isStepCompleted(currentStep) 
              ? `✓ ${WORKFLOW_STEPS[currentStep].label} completato. Prossimo reparto: ${WORKFLOW_STEPS[currentStep + 1].label}`
              : `In lavorazione presso: ${WORKFLOW_STEPS[currentStep].label}`
            }
          </Typography>
        </Box>
      )}
    </Box>
  )
}