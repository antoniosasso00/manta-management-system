import { z } from 'zod'

export const autoclaveLoadSchema = z.object({
  loadNumber: z.string().min(1, 'Load number is required'),
  autoclaveId: z.string().cuid(),
  curingCycleId: z.string().cuid('Invalid curing cycle ID'),
  plannedStart: z.date(),
  plannedEnd: z.date(),
  odlIds: z.array(z.string().cuid()).min(1, 'At least one ODL is required'),
}).refine((data) => data.plannedEnd > data.plannedStart, {
  message: 'Planned end must be after planned start',
  path: ['plannedEnd'],
})

export const autoclaveOptimizationSchema = z.object({
  autoclaveId: z.string().cuid(),
  odlIds: z.array(z.string().cuid()).min(1, 'At least one ODL is required'),
  curingCycleId: z.string().cuid('Invalid curing cycle ID'),
  prioritizeSpace: z.boolean().default(true),
  maxOptimizationTime: z.number().int().min(5).max(300).default(30), // seconds
})

export const layoutPositionSchema = z.object({
  odlId: z.string().cuid(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().min(0).max(360).default(0),
})

export const layoutResultSchema = z.object({
  positions: z.array(layoutPositionSchema),
  utilization: z.number().min(0).max(1),
  optimizationTime: z.number().positive(),
  algorithm: z.string(),
})

export type AutoclaveLoadInput = z.infer<typeof autoclaveLoadSchema>
export type AutoclaveOptimizationInput = z.infer<typeof autoclaveOptimizationSchema>
export type LayoutPosition = z.infer<typeof layoutPositionSchema>
export type LayoutResult = z.infer<typeof layoutResultSchema>