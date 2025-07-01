import { z } from 'zod'

// Part Number format validation (8G5350A0...)
const partNumberRegex = /^[A-Z0-9]{8,12}$/

export const createPartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Part number is required')
    .regex(partNumberRegex, 'Part number must be 8-12 alphanumeric characters (e.g. 8G5350A0)'),
  description: z.string()
    .min(1, 'Description is required')
    .max(255, 'Description too long'),
  
  // Production specifications (optional, configurabili localmente)
  defaultCuringCycleId: z.string().cuid('Invalid curing cycle ID').optional(),
  standardLength: z.number().positive('Length must be positive').optional(),
  standardWidth: z.number().positive('Width must be positive').optional(),
  standardHeight: z.number().positive('Height must be positive').optional(),
  defaultVacuumLines: z.number().int().min(1).max(10).optional(),
})

export const updatePartSchema = createPartSchema.partial().extend({
  id: z.string().cuid(),
})

export const partQuerySchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['partNumber', 'description', 'createdAt']).default('partNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Gamma MES sync schema
export const gammaSyncPartSchema = z.object({
  gammaId: z.string(),
  partNumber: z.string().regex(partNumberRegex),
  description: z.string().min(1),
})

export const bulkCreatePartsSchema = z.object({
  parts: z.array(createPartSchema).min(1).max(1000),
})

// Type exports
export type CreatePartInput = z.infer<typeof createPartSchema>
export type UpdatePartInput = z.infer<typeof updatePartSchema>
export type PartQueryInput = z.infer<typeof partQuerySchema>
export type GammaSyncPartInput = z.infer<typeof gammaSyncPartSchema>
export type BulkCreatePartsInput = z.infer<typeof bulkCreatePartsSchema>