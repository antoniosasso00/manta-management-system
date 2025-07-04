import { z } from 'zod'

// Part Number format validation - alfanumerico flessibile
const partNumberRegex = /^[A-Za-z0-9]+$/

export const createPartSchema = z.object({
  partNumber: z.string()
    .min(1, 'Il numero parte è obbligatorio')
    .regex(partNumberRegex, 'Il numero parte deve contenere solo lettere e numeri'),
  description: z.string()
    .min(1, 'La descrizione è obbligatoria')
})

export const updatePartSchema = createPartSchema.partial().extend({
  id: z.string().cuid(),
})

export const partQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
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