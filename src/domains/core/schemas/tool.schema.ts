import { z } from 'zod'

// Tool Part Number format validation
const toolPartNumberRegex = /^[A-Z0-9]{6,15}$/

export const createToolSchema = z.object({
  toolPartNumber: z.string()
    .min(1, 'Tool part number is required')
    .regex(toolPartNumberRegex, 'Tool part number must be 6-15 alphanumeric characters'),
  description: z.string()
    .max(255, 'Description too long')
    .optional(),
  base: z.number()
    .positive('Base dimension must be positive'),
  height: z.number()
    .positive('Height must be positive'),
  weight: z.number()
    .positive('Weight must be positive')
    .optional(),
  material: z.string()
    .max(100, 'Material description too long')
    .optional(),
  isActive: z.boolean().default(true),
})

export const updateToolSchema = createToolSchema.partial().extend({
  id: z.string().cuid(),
})

export const toolQuerySchema = z.object({
  search: z.string().optional(),
  material: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['toolPartNumber', 'description', 'material', 'createdAt']).default('toolPartNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Part-Tool association schema
export const createPartToolSchema = z.object({
  partId: z.string().cuid('Invalid part ID'),
  toolId: z.string().cuid('Invalid tool ID'),
})

export const bulkAssignToolsSchema = z.object({
  partId: z.string().cuid('Invalid part ID'),
  toolIds: z.array(z.string().cuid()).min(1, 'At least one tool must be selected'),
})

// Enhanced tool creation with parts association
export const createToolWithPartsSchema = createToolSchema.extend({
  associatedPartIds: z.array(z.string().cuid()).optional(),
})

export const updateToolWithPartsSchema = updateToolSchema.extend({
  associatedPartIds: z.array(z.string().cuid()).optional(),
})

// Type exports
export type CreateToolInput = z.infer<typeof createToolSchema>
export type UpdateToolInput = z.infer<typeof updateToolSchema>
export type ToolQueryInput = z.infer<typeof toolQuerySchema>
export type CreatePartToolInput = z.infer<typeof createPartToolSchema>
export type BulkAssignToolsInput = z.infer<typeof bulkAssignToolsSchema>
export type CreateToolWithPartsInput = z.infer<typeof createToolWithPartsSchema>
export type UpdateToolWithPartsInput = z.infer<typeof updateToolWithPartsSchema>