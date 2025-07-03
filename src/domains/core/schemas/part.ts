import { z } from 'zod'

// Base Part schema matching Prisma model
export const partSchema = z.object({
  id: z.string(),
  partNumber: z.string(),
  description: z.string(),
  material: z.string().nullable(),
  isActive: z.boolean(),
  defaultCuringCycleId: z.string().nullable(),
  dimensions: z.string().nullable(),
  weight: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  _count: z.object({
    odls: z.number().optional(),
    partTools: z.number().optional()
  }).optional()
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