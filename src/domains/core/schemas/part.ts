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

// Create Part schema - handles empty strings correctly
export const createPartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Il numero parte è obbligatorio')
    .regex(/^[A-Za-z0-9]+$/, 'Il numero parte deve contenere solo lettere e numeri'),
  description: z.string()
    .min(1, 'La descrizione è obbligatoria'),
  
  // Configurazioni Autoclavi (opzionali) - gestite in PartAutoclave
  curingCycleId: z.string().optional(),
  vacuumLines: z.number().optional(),
  autoclaveSetupTime: z.number().optional(),
  autoclaveLoadPosition: z.string().optional(),
  
  // Configurazioni Clean Room (opzionali)
  resinType: z.string().optional(),
  prepregCode: z.string().optional(),
  cycleTime: z.number().optional(),
  roomTemperature: z.number().optional(),
  
  // Configurazioni NDI (opzionali)
  inspectionTime: z.number().optional(),
  calibrationReq: z.string().optional(),
}).transform((data) => {
  // Clean up empty strings to undefined for optional fields
  const cleaned: any = {
    partNumber: data.partNumber,
    description: data.description
  }
  
  // Only add optional fields if they have values
  if (data.curingCycleId && data.curingCycleId.trim()) cleaned.curingCycleId = data.curingCycleId
  if (data.vacuumLines !== undefined && data.vacuumLines > 0) cleaned.vacuumLines = data.vacuumLines
  if (data.autoclaveSetupTime !== undefined && data.autoclaveSetupTime > 0) cleaned.autoclaveSetupTime = data.autoclaveSetupTime
  if (data.autoclaveLoadPosition && data.autoclaveLoadPosition.trim()) cleaned.autoclaveLoadPosition = data.autoclaveLoadPosition
  if (data.resinType && data.resinType.trim()) cleaned.resinType = data.resinType
  if (data.prepregCode && data.prepregCode.trim()) cleaned.prepregCode = data.prepregCode
  if (data.cycleTime !== undefined && data.cycleTime > 0) cleaned.cycleTime = data.cycleTime
  if (data.roomTemperature !== undefined && data.roomTemperature > 0) cleaned.roomTemperature = data.roomTemperature
  if (data.inspectionTime !== undefined && data.inspectionTime > 0) cleaned.inspectionTime = data.inspectionTime
  if (data.calibrationReq && data.calibrationReq.trim()) cleaned.calibrationReq = data.calibrationReq
  
  return cleaned
})

// Update Part input schema (without id and required fields)
export const updatePartInputSchema = z.object({
  partNumber: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  curingCycleId: z.string().optional(),
  vacuumLines: z.number().optional(),
  autoclaveSetupTime: z.number().optional(),
  autoclaveLoadPosition: z.string().optional(),
  resinType: z.string().optional(),
  prepregCode: z.string().optional(),
  cycleTime: z.number().optional(),
  roomTemperature: z.number().optional(),
  inspectionTime: z.number().optional(),
  calibrationReq: z.string().optional(),
})

// Query schema for API requests
export const partQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['partNumber', 'description', 'createdAt']).default('partNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeTools: z.boolean().optional(),
})

// Gamma MES sync schema
export const gammaSyncPartSchema = z.object({
  gammaId: z.string(),
  partNumber: z.string().regex(/^[A-Za-z0-9]+$/),
  description: z.string().min(1),
})

// Bulk create schema
export const bulkCreatePartsSchema = z.object({
  parts: z.array(createPartSchema).min(1).max(1000),
})

// Type exports
export type Part = z.infer<typeof partSchema>
export type CreatePartInput = z.infer<typeof createPartSchema>
export type UpdatePartInput = z.infer<typeof updatePartInputSchema>
export type PartQueryInput = z.infer<typeof partQuerySchema>
export type GammaSyncPartInput = z.infer<typeof gammaSyncPartSchema>
export type BulkCreatePartsInput = z.infer<typeof bulkCreatePartsSchema>