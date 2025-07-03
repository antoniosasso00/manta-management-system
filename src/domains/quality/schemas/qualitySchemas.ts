import { z } from 'zod'
import {
  QCInspectionType,
  QCFrequency,
  QCStatus,
  QCResult,
  NCType,
  NCSeverity,
  NCCategory,
  NCStatus,
  CAPAType,
  CAPAStatus,
} from '@prisma/client'

// ==================== QUALITY CONTROL PLAN SCHEMAS ====================

export const QualityControlPlanCreateSchema = z.object({
  partId: z.string().min(1, 'Part ID è obbligatorio'),
  version: z.string().min(1, 'Versione è obbligatoria').default('1.0'),
  title: z.string().min(1, 'Titolo è obbligatorio').max(200, 'Titolo troppo lungo'),
  description: z.string().optional(),
  inspectionType: z.nativeEnum(QCInspectionType),
  frequency: z.nativeEnum(QCFrequency),
  sampleSize: z.number().int().min(1, 'Dimensione campione deve essere almeno 1').default(1),
  acceptanceCriteria: z.record(z.any()).default({}),
})

export const QualityControlPlanUpdateSchema = QualityControlPlanCreateSchema.partial()

export const QualityControlPlanFilterSchema = z.object({
  partId: z.string().optional(),
  inspectionType: z.nativeEnum(QCInspectionType).optional(),
  frequency: z.nativeEnum(QCFrequency).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
})

// ==================== QUALITY INSPECTION SCHEMAS ====================

export const QualityInspectionCreateSchema = z.object({
  planId: z.string().min(1, 'Piano di controllo è obbligatorio'),
  odlId: z.string().min(1, 'ODL è obbligatorio'),
  inspectorId: z.string().min(1, 'Ispettore è obbligatorio'),
  notes: z.string().optional(),
})

export const QualityInspectionUpdateSchema = z.object({
  status: z.nativeEnum(QCStatus).optional(),
  result: z.nativeEnum(QCResult).optional(),
  measurements: z.record(z.any()).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  certificateNumber: z.string().optional(),
})

export const QualityInspectionStartSchema = z.object({
  inspectionId: z.string().min(1, 'ID ispezione è obbligatorio'),
})

export const QualityInspectionCompleteSchema = z.object({
  inspectionId: z.string().min(1, 'ID ispezione è obbligatorio'),
  result: z.nativeEnum(QCResult),
  measurements: z.record(z.any()).optional().default({}),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional().default([]),
})

export const QualityInspectionSignSchema = z.object({
  inspectionId: z.string().min(1, 'ID ispezione è obbligatorio'),
  certificateNumber: z.string().min(1, 'Numero certificato è obbligatorio'),
})

export const QualityInspectionFilterSchema = z.object({
  odlId: z.string().optional(),
  inspectorId: z.string().optional(),
  status: z.nativeEnum(QCStatus).optional(),
  result: z.nativeEnum(QCResult).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// ==================== NON CONFORMITY SCHEMAS ====================

export const NonConformityCreateSchema = z.object({
  inspectionId: z.string().optional(),
  odlId: z.string().min(1, 'ODL è obbligatorio'),
  type: z.nativeEnum(NCType),
  severity: z.nativeEnum(NCSeverity),
  category: z.nativeEnum(NCCategory),
  title: z.string().min(1, 'Titolo è obbligatorio').max(200, 'Titolo troppo lungo'),
  description: z.string().min(1, 'Descrizione è obbligatoria'),
  rootCause: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export const NonConformityUpdateSchema = z.object({
  type: z.nativeEnum(NCType).optional(),
  severity: z.nativeEnum(NCSeverity).optional(),
  category: z.nativeEnum(NCCategory).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  rootCause: z.string().optional(),
  status: z.nativeEnum(NCStatus).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export const NonConformityFilterSchema = z.object({
  odlId: z.string().optional(),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  type: z.nativeEnum(NCType).optional(),
  severity: z.nativeEnum(NCSeverity).optional(),
  category: z.nativeEnum(NCCategory).optional(),
  status: z.nativeEnum(NCStatus).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// ==================== CORRECTIVE ACTION SCHEMAS ====================

export const CorrectiveActionCreateSchema = z.object({
  nonConformityId: z.string().min(1, 'Non conformità è obbligatoria'),
  type: z.nativeEnum(CAPAType),
  title: z.string().min(1, 'Titolo è obbligatorio').max(200, 'Titolo troppo lungo'),
  description: z.string().min(1, 'Descrizione è obbligatoria'),
  plannedAction: z.string().min(1, 'Azione pianificata è obbligatoria'),
  dueDate: z.string().datetime(),
  assignedTo: z.string().min(1, 'Assegnatario è obbligatorio'),
})

export const CorrectiveActionUpdateSchema = z.object({
  type: z.nativeEnum(CAPAType).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  plannedAction: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  status: z.nativeEnum(CAPAStatus).optional(),
  actualAction: z.string().optional(),
  effectiveness: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
})

export const CorrectiveActionCompleteSchema = z.object({
  actionId: z.string().min(1, 'ID azione è obbligatorio'),
  actualAction: z.string().min(1, 'Azione effettuata è obbligatoria'),
})

export const CorrectiveActionVerifySchema = z.object({
  actionId: z.string().min(1, 'ID azione è obbligatorio'),
  effectiveness: z.string().min(1, 'Valutazione efficacia è obbligatoria'),
  followUpDate: z.string().datetime().optional(),
})

export const CorrectiveActionFilterSchema = z.object({
  nonConformityId: z.string().optional(),
  assignedTo: z.string().optional(),
  type: z.nativeEnum(CAPAType).optional(),
  status: z.nativeEnum(CAPAStatus).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// ==================== QUALITY CERTIFICATE SCHEMAS ====================

export const QualityCertificateCreateSchema = z.object({
  odlId: z.string().min(1, 'ODL è obbligatorio'),
  certificateNumber: z.string().min(1, 'Numero certificato è obbligatorio'),
  title: z.string().min(1, 'Titolo è obbligatorio').max(200, 'Titolo troppo lungo'),
  description: z.string().optional(),
  conformityStatus: z.boolean().default(false),
  standardsRef: z.array(z.string()).default([]),
})

export const QualityCertificateUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  conformityStatus: z.boolean().optional(),
  standardsRef: z.array(z.string()).optional(),
  documentPath: z.string().optional(),
})

export const QualityCertificateApproveSchema = z.object({
  certificateId: z.string().min(1, 'ID certificato è obbligatorio'),
})

export const QualityCertificateFilterSchema = z.object({
  odlId: z.string().optional(),
  issuedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  conformityStatus: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
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

export type QualityControlPlanCreate = z.infer<typeof QualityControlPlanCreateSchema>
export type QualityControlPlanUpdate = z.infer<typeof QualityControlPlanUpdateSchema>
export type QualityControlPlanFilter = z.infer<typeof QualityControlPlanFilterSchema>

export type QualityInspectionCreate = z.infer<typeof QualityInspectionCreateSchema>
export type QualityInspectionUpdate = z.infer<typeof QualityInspectionUpdateSchema>
export type QualityInspectionStart = z.infer<typeof QualityInspectionStartSchema>
export type QualityInspectionComplete = z.infer<typeof QualityInspectionCompleteSchema>
export type QualityInspectionSign = z.infer<typeof QualityInspectionSignSchema>
export type QualityInspectionFilter = z.infer<typeof QualityInspectionFilterSchema>

export type NonConformityCreate = z.infer<typeof NonConformityCreateSchema>
export type NonConformityUpdate = z.infer<typeof NonConformityUpdateSchema>
export type NonConformityFilter = z.infer<typeof NonConformityFilterSchema>

export type CorrectiveActionCreate = z.infer<typeof CorrectiveActionCreateSchema>
export type CorrectiveActionUpdate = z.infer<typeof CorrectiveActionUpdateSchema>
export type CorrectiveActionComplete = z.infer<typeof CorrectiveActionCompleteSchema>
export type CorrectiveActionVerify = z.infer<typeof CorrectiveActionVerifySchema>
export type CorrectiveActionFilter = z.infer<typeof CorrectiveActionFilterSchema>

export type QualityCertificateCreate = z.infer<typeof QualityCertificateCreateSchema>
export type QualityCertificateUpdate = z.infer<typeof QualityCertificateUpdateSchema>
export type QualityCertificateApprove = z.infer<typeof QualityCertificateApproveSchema>
export type QualityCertificateFilter = z.infer<typeof QualityCertificateFilterSchema>

export type PaginationParams = z.infer<typeof PaginationSchema>
export type BulkOperation = z.infer<typeof BulkOperationSchema>