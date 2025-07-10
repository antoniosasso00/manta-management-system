import { z } from 'zod'

// API Part schema matching Part entity structure with serialized dates
export const partSchema = z.object({
  id: z.string(),
  partNumber: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Gamma MES sync tracking
  gammaId: z.string().nullable().optional(),
  lastSyncAt: z.string().datetime().nullable().optional(),
  syncStatus: z.enum(['SUCCESS', 'FAILED', 'PENDING']),
  
  // Configuration via extension tables
  autoclaveConfig: z.object({
    curingCycleId: z.string(),
    vacuumLines: z.number(),
    setupTime: z.number().nullable(),
    loadPosition: z.string().nullable(),
    curingCycle: z.object({
      id: z.string(),
      code: z.string(),
      name: z.string()
    }).optional()
  }).nullable().optional(),
  
  cleanroomConfig: z.object({
    resinType: z.string().nullable(),
    prepregCode: z.string().nullable(),
    cycleTime: z.number().nullable(),
    roomTemperature: z.number().nullable()
  }).nullable().optional(),
  
  ndiConfig: z.object({
    inspectionTime: z.number().nullable(),
    calibrationReq: z.string().nullable()
  }).nullable().optional(),
  
  partTools: z.array(z.object({
    toolId: z.string(),
    tool: z.object({
      base: z.number(),
      height: z.number(),
      weight: z.number()
    }).optional()
  })).optional(),
  
  // Optional counts for API responses
  _count: z.object({
    odls: z.number().optional(),
    partTools: z.number().optional()
  }).optional()
})

// Paginated response schema for getAll (backward compatibility)
export const paginatedPartsSchema = z.object({
  parts: z.array(partSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number()
})

// New standardized API response schema
export const apiPartsResponseSchema = z.object({
  data: z.array(partSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number()
  }),
  success: z.boolean()
})

// Create Part schema (aligned with part.schema.ts)
export const createPartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Il numero parte è obbligatorio')
    .regex(/^[A-Za-z0-9]+$/, 'Il numero parte deve contenere solo lettere e numeri'),
  description: z.string()
    .min(1, 'La descrizione è obbligatoria'),
  
  // Configurazioni Autoclavi (opzionali) - gestite in PartAutoclave
  curingCycleId: z.string().optional(),
  vacuumLines: z.number().int().min(1).max(10).optional(),
  autoclaveSetupTime: z.number().int().positive().optional(),
  autoclaveLoadPosition: z.string().optional(),
  
  // Configurazioni Clean Room (opzionali)
  resinType: z.string().optional(),
  prepregCode: z.string().optional(),
  cycleTime: z.number().int().positive().optional(),
  roomTemperature: z.number().positive().optional(),
  
  // Configurazioni NDI (opzionali)
  inspectionTime: z.number().int().positive().optional(),
  calibrationReq: z.string().optional(),
})

// Update Part schema (aligned with part.schema.ts)
export const updatePartSchema = createPartSchema.partial().extend({
  id: z.string().cuid(),
})

// Update Part input schema (without id)
export const updatePartInputSchema = createPartSchema.partial()

// Type exports
export type Part = z.infer<typeof partSchema>
export type CreatePartInput = z.infer<typeof createPartSchema>
export type UpdatePartInput = z.infer<typeof updatePartSchema>
export type UpdatePartInputData = z.infer<typeof updatePartInputSchema>