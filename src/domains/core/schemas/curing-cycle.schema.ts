import { z } from 'zod'

// Curing Cycle code format validation
const curingCycleCodeRegex = /^[A-Z0-9_]{3,10}$/

const baseCuringCycleSchema = z.object({
  code: z.string()
    .min(1, 'Curing cycle code is required')
    .regex(curingCycleCodeRegex, 'Code must be 3-10 alphanumeric characters with underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  
  // Prima stasi (obbligatoria)
  phase1Temperature: z.number()
    .min(0, 'Temperature must be positive')
    .max(300, 'Temperature too high'),
  phase1Pressure: z.number()
    .min(0, 'Pressure must be positive')
    .max(10, 'Pressure too high'),
  phase1Duration: z.number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours'),
  
  // Seconda stasi (opzionale)
  phase2Temperature: z.number()
    .min(0, 'Temperature must be positive')
    .max(300, 'Temperature too high')
    .optional(),
  phase2Pressure: z.number()
    .min(0, 'Pressure must be positive')
    .max(10, 'Pressure too high')
    .optional(),
  phase2Duration: z.number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),
  
  isActive: z.boolean().default(true),
})

export const createCuringCycleSchema = baseCuringCycleSchema.refine(
  (data) => {
    // Se è specificata la temperatura della fase 2, devono essere specificati anche pressione e durata
    const hasPhase2Temp = data.phase2Temperature !== undefined
    const hasPhase2Pressure = data.phase2Pressure !== undefined
    const hasPhase2Duration = data.phase2Duration !== undefined
    
    if (hasPhase2Temp || hasPhase2Pressure || hasPhase2Duration) {
      return hasPhase2Temp && hasPhase2Pressure && hasPhase2Duration
    }
    return true
  },
  {
    message: 'If phase 2 is specified, temperature, pressure and duration are all required',
    path: ['phase2Temperature'],
  }
)

export const updateCuringCycleSchema = baseCuringCycleSchema.partial().extend({
  id: z.string().cuid(),
})

export const curingCycleQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['code', 'name', 'createdAt']).default('code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})