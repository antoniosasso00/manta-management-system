import { z } from 'zod'
import { ODL_STATUS } from '@/utils/constants'

const ODLStatus = z.enum(Object.values(ODL_STATUS) as [string, ...string[]])

// Base ODL schema matching Prisma model
export const odlSchema = z.object({
  id: z.string(),
  odlNumber: z.string(),
  partId: z.string(),
  quantity: z.number().int(),
  status: ODLStatus,
  priority: z.number().int(),
  notes: z.string().nullable(),
  customerId: z.string().nullable(),
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  _count: z.object({
    productionEvents: z.number().optional()
  }).optional()
})

// Create ODL schema
export const createODLSchema = z.object({
  odlNumber: z.string()
    .min(1, 'Numero ODL richiesto')
    .max(50, 'Numero ODL troppo lungo'),
  partId: z.string()
    .min(1, 'Parte richiesta'),
  quantity: z.number()
    .int('La quantità deve essere un numero intero')
    .positive('La quantità deve essere positiva'),
  status: z.enum([
    'CREATED',
    'ASSIGNED_TO_HONEYCOMB', 'IN_HONEYCOMB', 'HONEYCOMB_COMPLETED',
    'ASSIGNED_TO_CLEANROOM', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 
    'ASSIGNED_TO_AUTOCLAVE', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED',
    'ASSIGNED_TO_CONTROLLO_NUMERICO', 'IN_CONTROLLO_NUMERICO', 'CONTROLLO_NUMERICO_COMPLETED',
    'ASSIGNED_TO_NDI', 'IN_NDI', 'NDI_COMPLETED',
    'ASSIGNED_TO_MONTAGGIO', 'IN_MONTAGGIO', 'MONTAGGIO_COMPLETED',
    'ASSIGNED_TO_VERNICIATURA', 'IN_VERNICIATURA', 'VERNICIATURA_COMPLETED',
    'ASSIGNED_TO_CONTROLLO_QUALITA', 'IN_CONTROLLO_QUALITA', 'CONTROLLO_QUALITA_COMPLETED',
    'COMPLETED', 'ON_HOLD', 'CANCELLED'
  ]).default('CREATED'),
  priority: z.number()
    .int('La priorità deve essere un numero intero')
    .min(1, 'La priorità minima è 1')
    .max(10, 'La priorità massima è 10')
    .default(5),
  notes: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
})

// Update ODL schema
export const updateODLSchema = z.object({
  odlNumber: z.string()
    .min(1, 'Numero ODL richiesto')
    .max(50, 'Numero ODL troppo lungo')
    .optional(),
  partId: z.string()
    .min(1, 'Parte richiesta')
    .optional(),
  quantity: z.number()
    .int('La quantità deve essere un numero intero')
    .positive('La quantità deve essere positiva')
    .optional(),
  status: z.enum([
    'CREATED',
    'ASSIGNED_TO_HONEYCOMB', 'IN_HONEYCOMB', 'HONEYCOMB_COMPLETED',
    'ASSIGNED_TO_CLEANROOM', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 
    'ASSIGNED_TO_AUTOCLAVE', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED',
    'ASSIGNED_TO_CONTROLLO_NUMERICO', 'IN_CONTROLLO_NUMERICO', 'CONTROLLO_NUMERICO_COMPLETED',
    'ASSIGNED_TO_NDI', 'IN_NDI', 'NDI_COMPLETED',
    'ASSIGNED_TO_MONTAGGIO', 'IN_MONTAGGIO', 'MONTAGGIO_COMPLETED',
    'ASSIGNED_TO_VERNICIATURA', 'IN_VERNICIATURA', 'VERNICIATURA_COMPLETED',
    'ASSIGNED_TO_CONTROLLO_QUALITA', 'IN_CONTROLLO_QUALITA', 'CONTROLLO_QUALITA_COMPLETED',
    'COMPLETED', 'ON_HOLD', 'CANCELLED'
  ]).optional(),
  priority: z.number()
    .int('La priorità deve essere un numero intero')
    .min(1, 'La priorità minima è 1')
    .max(10, 'La priorità massima è 10')
    .optional(),
  notes: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional()
})

// Type exports
export type ODL = z.infer<typeof odlSchema>
export type CreateODLInput = z.infer<typeof createODLSchema>
export type UpdateODLInput = z.infer<typeof updateODLSchema>