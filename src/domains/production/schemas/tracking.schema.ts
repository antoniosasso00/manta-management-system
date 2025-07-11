import { z } from 'zod'
import { EventType } from '@prisma/client'

// Schema base per eventi di produzione
export const productionEventSchema = z.object({
  odlId: z.string().min(1, 'ODL ID richiesto'),
  departmentId: z.string().min(1, 'Reparto richiesto'),
  eventType: z.nativeEnum(EventType),
  userId: z.string().optional(), // Opzionale per ora come richiesto
  notes: z.string().optional(),
  timestamp: z.date().optional(), // Se non fornito, usa il default del DB
  duration: z.number().optional(), // Durata timer in millisecondi
})

// Schema per creare evento manuale (form input)
export const createManualEventSchema = productionEventSchema.omit({
  timestamp: true,
  userId: true,
}).extend({
  confirmationRequired: z.boolean().default(true), // Per il dialog di conferma
})

// Schema per risposta API eventi
export const productionEventResponseSchema = productionEventSchema.extend({
  id: z.string(),
  timestamp: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }).optional(),
  department: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }),
  odl: z.object({
    id: z.string(),
    odlNumber: z.string(),
    status: z.string(),
    part: z.object({
      partNumber: z.string(),
      description: z.string(),
    }),
  }),
})

// Schema per lista eventi con filtri
export const productionEventFilterSchema = z.object({
  odlId: z.string().optional(),
  departmentId: z.string().optional(),
  eventType: z.nativeEnum(EventType).optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
})

// Schema per ODL con stato tracking
export const odlTrackingStatusSchema = z.object({
  id: z.string(),
  odlNumber: z.string(),
  qrCode: z.string(),
  status: z.string(),
  priority: z.string(),
  quantity: z.number(),
  part: z.object({
    partNumber: z.string(),
    description: z.string(),
  }),
  currentDepartment: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).nullable(),
  lastEvent: productionEventResponseSchema.nullable(),
  timeInCurrentDepartment: z.number().nullable(), // Minuti
  totalProductionTime: z.number(), // Minuti totali
  isPaused: z.boolean().default(false), // Stato di pausa
})

// Schema per dashboard reparto
export const departmentODLListSchema = z.object({
  departmentId: z.string(),
  odlIncoming: z.array(odlTrackingStatusSchema), // ODL dal reparto precedente
  odlInPreparation: z.array(odlTrackingStatusSchema),
  odlInProduction: z.array(odlTrackingStatusSchema),
  odlCompleted: z.array(odlTrackingStatusSchema),
  statistics: z.object({
    totalActive: z.number(),
    avgCycleTime: z.number(), // Minuti
    efficiency: z.number(), // Percentuale
  }),
})

// Types derivati dagli schema
export type ProductionEvent = z.infer<typeof productionEventSchema>
export type CreateManualEvent = z.infer<typeof createManualEventSchema>
export type ProductionEventResponse = z.infer<typeof productionEventResponseSchema>
export type ProductionEventFilter = z.infer<typeof productionEventFilterSchema>
export type ODLTrackingStatus = z.infer<typeof odlTrackingStatusSchema>
export type DepartmentODLList = z.infer<typeof departmentODLListSchema>