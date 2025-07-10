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
  
  // Production specifications
  defaultCuringCycle: z.string().nullable().optional(),
  standardLength: z.number().nullable().optional(),
  standardWidth: z.number().nullable().optional(), 
  standardHeight: z.number().nullable().optional(),
  defaultVacuumLines: z.number().nullable().optional(),
  
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

// Create Part schema
export const createPartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Numero parte richiesto')
    .max(50, 'Numero parte troppo lungo'),
  description: z.string()
    .min(1, 'Descrizione richiesta')
    .max(255, 'Descrizione troppo lunga'),
  material: z.string()
    .min(1, 'Materiale richiesto')
    .max(100, 'Materiale troppo lungo'),
  isActive: z.boolean().default(true),
  defaultCuringCycleId: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  weight: z.number().positive('Il peso deve essere positivo').nullable().optional()
})

// Update Part schema
export const updatePartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Numero parte richiesto')
    .max(50, 'Numero parte troppo lungo')
    .optional(),
  description: z.string()
    .min(1, 'Descrizione richiesta')
    .max(255, 'Descrizione troppo lunga')
    .optional(),
  material: z.string()
    .min(1, 'Materiale richiesto')
    .max(100, 'Materiale troppo lungo')
    .optional(),
  isActive: z.boolean().optional(),
  defaultCuringCycleId: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  weight: z.number().positive('Il peso deve essere positivo').nullable().optional()
})

// Type exports
export type Part = z.infer<typeof partSchema>
export type CreatePartInput = z.infer<typeof createPartSchema>
export type UpdatePartInput = z.infer<typeof updatePartSchema>