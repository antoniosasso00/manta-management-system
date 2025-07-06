import { z } from 'zod'

export const createODLSchema = z.object({
  odlNumber: z.string().min(1, 'ODL number is required'),
  partId: z.string().cuid('Part ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  status: z.enum(['CREATED', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI', 'NDI_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('CREATED'),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  dueDate: z.date().optional(),
  expectedCompletionDate: z.date().optional(),
  
  // Override dimensions (if different from part standard)
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  
  // Override production data (if different from part standard)
  curingCycleId: z.string().cuid('Invalid curing cycle ID').optional(),
  vacuumLines: z.number().int().min(1).max(10).optional(),
})

export const updateODLSchema = createODLSchema.partial().extend({
  id: z.string().cuid(),
})

export const odlQuerySchema = z.object({
  search: z.string().optional(),
  partId: z.string().cuid().optional(),
  status: z.enum(['CREATED', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['odlNumber', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const odlEventSchema = z.object({
  odlId: z.string().cuid(),
  departmentId: z.string().cuid(),
  eventType: z.enum(['ENTRY', 'EXIT', 'PAUSE', 'RESUME', 'NOTE']),
  notes: z.string().optional(),
})

// Gamma MES sync schema
export const gammaSyncODLSchema = z.object({
  gammaId: z.string(),
  odlNumber: z.string().min(1),
  partNumber: z.string().min(1), // Will be resolved to partId
  quantity: z.number().int().min(1),
})

export const bulkCreateODLSchema = z.object({
  odls: z.array(createODLSchema).min(1).max(500),
})

// Complete ODL entity schema (matches Prisma model)
export const odlSchema = z.object({
  id: z.string().cuid(),
  odlNumber: z.string(),
  partId: z.string(),
  quantity: z.number().int(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  status: z.enum(['CREATED', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI', 'NDI_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
  qrCode: z.string(),
  expectedCompletionDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  gammaId: z.string().nullable(),
  lastSyncAt: z.date().nullable(),
  syncStatus: z.enum(['SUCCESS', 'PENDING', 'FAILED']),
  length: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  curingCycleId: z.string().nullable(),
  vacuumLines: z.number().int().nullable(),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  dueDate: z.date().optional(),
})

// Type exports
export type CreateODLInput = z.infer<typeof createODLSchema>
export type UpdateODLInput = z.infer<typeof updateODLSchema>
export type ODLQueryInput = z.infer<typeof odlQuerySchema>
export type ODLEventInput = z.infer<typeof odlEventSchema>
export type GammaSyncODLInput = z.infer<typeof gammaSyncODLSchema>
export type BulkCreateODLInput = z.infer<typeof bulkCreateODLSchema>
export type ODL = z.infer<typeof odlSchema>