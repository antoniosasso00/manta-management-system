import { z } from 'zod'
import {
  HoneycombType,
  HoneycombProcessType,
  ProcessStatus,
  QualityResult,
} from '@prisma/client'

// ==================== HONEYCOMB CONFIGURATION SCHEMAS ====================

export const HoneycombConfigurationCreateSchema = z.object({
  partId: z.string().min(1, 'Part ID è obbligatorio'),
  coreType: z.nativeEnum(HoneycombType),
  cellSize: z.number().positive('Dimensione cella deve essere positiva'),
  coreDensity: z.number().positive('Densità core deve essere positiva'),
  coreThickness: z.number().positive('Spessore core deve essere positivo'),
  skinMaterial: z.string().optional(),
  skinThickness: z.number().positive().optional(),
  adhesiveType: z.string().min(1, 'Tipo adesivo è obbligatorio'),
  cureTemperature: z.number().min(0, 'Temperatura deve essere positiva'),
  cureTime: z.number().int().positive('Tempo cura deve essere positivo'),
  pressure: z.number().positive('Pressione deve essere positiva'),
  bondStrength: z.number().positive().optional(),
  compressionStrength: z.number().positive().optional(),
})

export const HoneycombConfigurationUpdateSchema = HoneycombConfigurationCreateSchema.partial()

export const HoneycombConfigurationFilterSchema = z.object({
  partId: z.string().optional(),
  coreType: z.nativeEnum(HoneycombType).optional(),
  search: z.string().optional(),
})

// ==================== HONEYCOMB PROCESS SCHEMAS ====================

export const HoneycombProcessCreateSchema = z.object({
  configId: z.string().min(1, 'Configurazione è obbligatoria'),
  odlId: z.string().min(1, 'ODL è obbligatorio'),
  operatorId: z.string().min(1, 'Operatore è obbligatorio'),
  processType: z.nativeEnum(HoneycombProcessType),
  notes: z.string().optional(),
})

export const HoneycombProcessStartSchema = z.object({
  processId: z.string().min(1, 'ID processo è obbligatorio'),
  actualTemperature: z.number().optional(),
  actualPressure: z.number().optional(),
})

export const HoneycombProcessCompleteSchema = z.object({
  processId: z.string().min(1, 'ID processo è obbligatorio'),
  actualTemperature: z.number().optional(),
  actualPressure: z.number().optional(),
  actualTime: z.number().int().optional(),
  measuredLength: z.number().optional(),
  measuredWidth: z.number().optional(),
  measuredThickness: z.number().optional(),
  visualInspection: z.nativeEnum(QualityResult).optional(),
  bondQuality: z.nativeEnum(QualityResult).optional(),
  dimensionalCheck: z.nativeEnum(QualityResult).optional(),
  notes: z.string().optional(),
  issues: z.string().optional(),
})

export const HoneycombProcessUpdateSchema = z.object({
  status: z.nativeEnum(ProcessStatus).optional(),
  actualTemperature: z.number().optional(),
  actualPressure: z.number().optional(),
  actualTime: z.number().int().optional(),
  measuredLength: z.number().optional(),
  measuredWidth: z.number().optional(),
  measuredThickness: z.number().optional(),
  visualInspection: z.nativeEnum(QualityResult).optional(),
  bondQuality: z.nativeEnum(QualityResult).optional(),
  dimensionalCheck: z.nativeEnum(QualityResult).optional(),
  notes: z.string().optional(),
  issues: z.string().optional(),
})

export const HoneycombProcessFilterSchema = z.object({
  odlId: z.string().optional(),
  operatorId: z.string().optional(),
  processType: z.nativeEnum(HoneycombProcessType).optional(),
  status: z.nativeEnum(ProcessStatus).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// ==================== QUALITY CONTROL SCHEMAS ====================

export const HoneycombQualityCheckSchema = z.object({
  processId: z.string().min(1, 'ID processo è obbligatorio'),
  visualInspection: z.nativeEnum(QualityResult),
  bondQuality: z.nativeEnum(QualityResult),
  dimensionalCheck: z.nativeEnum(QualityResult),
  notes: z.string().optional(),
  issues: z.string().optional(),
})

// ==================== BATCH OPERATION SCHEMAS ====================

export const HoneycombBatchCreateSchema = z.object({
  processes: z.array(z.string()).min(1, 'Almeno un processo deve essere selezionato'),
  batchNotes: z.string().optional(),
})

export const HoneycombBatchStatusUpdateSchema = z.object({
  processIds: z.array(z.string()).min(1, 'Almeno un processo deve essere selezionato'),
  status: z.nativeEnum(ProcessStatus),
  notes: z.string().optional(),
})

// ==================== STATISTICS SCHEMAS ====================

export const HoneycombStatsFilterSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  operatorId: z.string().optional(),
  processType: z.nativeEnum(HoneycombProcessType).optional(),
})

// ==================== COMMON SCHEMAS ====================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const BulkOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'Almeno un elemento deve essere selezionato'),
})

// ==================== TYPE EXPORTS ====================

export type HoneycombConfigurationCreate = z.infer<typeof HoneycombConfigurationCreateSchema>
export type HoneycombConfigurationUpdate = z.infer<typeof HoneycombConfigurationUpdateSchema>
export type HoneycombConfigurationFilter = z.infer<typeof HoneycombConfigurationFilterSchema>

export type HoneycombProcessCreate = z.infer<typeof HoneycombProcessCreateSchema>
export type HoneycombProcessStart = z.infer<typeof HoneycombProcessStartSchema>
export type HoneycombProcessComplete = z.infer<typeof HoneycombProcessCompleteSchema>
export type HoneycombProcessUpdate = z.infer<typeof HoneycombProcessUpdateSchema>
export type HoneycombProcessFilter = z.infer<typeof HoneycombProcessFilterSchema>

export type HoneycombQualityCheck = z.infer<typeof HoneycombQualityCheckSchema>

export type HoneycombBatchCreate = z.infer<typeof HoneycombBatchCreateSchema>
export type HoneycombBatchStatusUpdate = z.infer<typeof HoneycombBatchStatusUpdateSchema>

export type HoneycombStatsFilter = z.infer<typeof HoneycombStatsFilterSchema>

export type PaginationParams = z.infer<typeof PaginationSchema>
export type BulkOperation = z.infer<typeof BulkOperationSchema>

// ==================== VALIDATION HELPERS ====================

export const validateHoneycombDimensions = (
  length: number,
  width: number,
  thickness: number
): boolean => {
  // Validazioni specifiche per honeycomb aerospace
  if (length <= 0 || width <= 0 || thickness <= 0) return false
  if (length > 3000 || width > 2000) return false // Max dimensioni pratiche mm
  if (thickness < 3 || thickness > 50) return false // Range spessori tipici
  return true
}

export const validateProcessParameters = (
  temperature: number,
  pressure: number,
  time: number
): boolean => {
  // Validazioni parametri processo
  if (temperature < 20 || temperature > 200) return false // Range temperature °C
  if (pressure < 0.1 || pressure > 10) return false // Range pressioni bar
  if (time < 5 || time > 600) return false // Range tempi minuti
  return true
}

export const getCoreTypeDisplayName = (coreType: HoneycombType): string => {
  const displayNames: Record<HoneycombType, string> = {
    ALUMINUM_3_16: 'Alluminio 3/16"',
    ALUMINUM_1_4: 'Alluminio 1/4"',
    ALUMINUM_3_8: 'Alluminio 3/8"',
    NOMEX_3_16: 'Nomex 3/16"',
    NOMEX_1_4: 'Nomex 1/4"',
    NOMEX_3_8: 'Nomex 3/8"',
    CARBON_3_16: 'Carbon Fiber 3/16"',
    CARBON_1_4: 'Carbon Fiber 1/4"',
  }
  return displayNames[coreType] || coreType
}

export const getProcessTypeDisplayName = (processType: HoneycombProcessType): string => {
  const displayNames: Record<HoneycombProcessType, string> = {
    CORE_CUTTING: 'Taglio Core',
    SKIN_PREPARATION: 'Preparazione Skin',
    BONDING: 'Incollaggio',
    CURING: 'Cura',
    TRIMMING: 'Rifilatura',
    INSPECTION: 'Ispezione',
  }
  return displayNames[processType] || processType
}