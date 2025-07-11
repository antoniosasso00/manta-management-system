import { ODLStatus, DepartmentType } from '@prisma/client'

/**
 * Definisce le transizioni di stato valide per il workflow ODL
 */
export const STATUS_TRANSITIONS: Record<ODLStatus, ODLStatus[]> = {
  [ODLStatus.CREATED]: [
    // Prima fase: assegnazione a reparto
    ODLStatus.ASSIGNED_TO_CLEANROOM,
    ODLStatus.ASSIGNED_TO_HONEYCOMB,
    ODLStatus.ASSIGNED_TO_AUTOCLAVE,
    ODLStatus.ASSIGNED_TO_CONTROLLO_NUMERICO,
    ODLStatus.ASSIGNED_TO_NDI,
    ODLStatus.ASSIGNED_TO_MONTAGGIO,
    ODLStatus.ASSIGNED_TO_VERNICIATURA,
    ODLStatus.ASSIGNED_TO_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],

  // Honeycomb workflow
  [ODLStatus.ASSIGNED_TO_HONEYCOMB]: [
    ODLStatus.IN_HONEYCOMB,
    ODLStatus.ON_HOLD
  ],

  // Clean room workflow
  [ODLStatus.ASSIGNED_TO_CLEANROOM]: [
    ODLStatus.IN_CLEANROOM,
    ODLStatus.ON_HOLD
  ],

  // Autoclave workflow
  [ODLStatus.ASSIGNED_TO_AUTOCLAVE]: [
    ODLStatus.IN_AUTOCLAVE,
    ODLStatus.ON_HOLD
  ],

  // CNC workflow
  [ODLStatus.ASSIGNED_TO_CONTROLLO_NUMERICO]: [
    ODLStatus.IN_CONTROLLO_NUMERICO,
    ODLStatus.ON_HOLD
  ],

  // NDI workflow
  [ODLStatus.ASSIGNED_TO_NDI]: [
    ODLStatus.IN_NDI,
    ODLStatus.ON_HOLD
  ],

  // Assembly workflow
  [ODLStatus.ASSIGNED_TO_MONTAGGIO]: [
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.ON_HOLD
  ],

  // Coating workflow
  [ODLStatus.ASSIGNED_TO_VERNICIATURA]: [
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.ON_HOLD
  ],

  // Quality control workflow
  [ODLStatus.ASSIGNED_TO_CONTROLLO_QUALITA]: [
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],

  // Motors workflow
  [ODLStatus.ASSIGNED_TO_MOTORI]: [
    ODLStatus.IN_MOTORI,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_CLEANROOM]: [
    ODLStatus.CLEANROOM_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.CLEANROOM_COMPLETED]: [
    ODLStatus.IN_AUTOCLAVE,
    ODLStatus.IN_HONEYCOMB,
    ODLStatus.IN_CONTROLLO_NUMERICO,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_AUTOCLAVE]: [
    ODLStatus.AUTOCLAVE_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.AUTOCLAVE_COMPLETED]: [
    ODLStatus.IN_CONTROLLO_NUMERICO,
    ODLStatus.IN_NDI,
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_HONEYCOMB]: [
    ODLStatus.HONEYCOMB_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.HONEYCOMB_COMPLETED]: [
    ODLStatus.IN_AUTOCLAVE,
    ODLStatus.IN_CONTROLLO_NUMERICO,
    ODLStatus.IN_NDI,
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_CONTROLLO_NUMERICO]: [
    ODLStatus.CONTROLLO_NUMERICO_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.CONTROLLO_NUMERICO_COMPLETED]: [
    ODLStatus.IN_NDI,
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_NDI]: [
    ODLStatus.NDI_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.NDI_COMPLETED]: [
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_MONTAGGIO]: [
    ODLStatus.MONTAGGIO_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.MONTAGGIO_COMPLETED]: [
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_VERNICIATURA]: [
    ODLStatus.VERNICIATURA_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.VERNICIATURA_COMPLETED]: [
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.IN_CONTROLLO_QUALITA]: [
    ODLStatus.CONTROLLO_QUALITA_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.CONTROLLO_QUALITA_COMPLETED]: [
    ODLStatus.COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  // Aggiungo stati mancanti
  [ODLStatus.IN_MOTORI]: [
    ODLStatus.MOTORI_COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.MOTORI_COMPLETED]: [
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.COMPLETED,
    ODLStatus.ON_HOLD
  ],
  
  [ODLStatus.ON_HOLD]: [
    ODLStatus.IN_CLEANROOM,
    ODLStatus.IN_AUTOCLAVE,
    ODLStatus.IN_HONEYCOMB,
    ODLStatus.IN_CONTROLLO_NUMERICO,
    ODLStatus.IN_NDI,
    ODLStatus.IN_MONTAGGIO,
    ODLStatus.IN_VERNICIATURA,
    ODLStatus.IN_CONTROLLO_QUALITA,
    ODLStatus.IN_MOTORI,
    ODLStatus.COMPLETED,
    ODLStatus.CANCELLED
  ],
  
  [ODLStatus.COMPLETED]: [], // Stato finale
  [ODLStatus.CANCELLED]: [] // Stato finale
}

/**
 * Mappa tipo reparto -> stato ENTRY
 */
export const DEPARTMENT_ENTRY_STATUS: Record<DepartmentType, ODLStatus> = {
  [DepartmentType.CLEANROOM]: ODLStatus.IN_CLEANROOM,
  [DepartmentType.AUTOCLAVE]: ODLStatus.IN_AUTOCLAVE,
  [DepartmentType.HONEYCOMB]: ODLStatus.IN_HONEYCOMB,
  [DepartmentType.CONTROLLO_NUMERICO]: ODLStatus.IN_CONTROLLO_NUMERICO,
  [DepartmentType.NDI]: ODLStatus.IN_NDI,
  [DepartmentType.MONTAGGIO]: ODLStatus.IN_MONTAGGIO,
  [DepartmentType.VERNICIATURA]: ODLStatus.IN_VERNICIATURA,
  [DepartmentType.CONTROLLO_QUALITA]: ODLStatus.IN_CONTROLLO_QUALITA,
  [DepartmentType.MOTORI]: ODLStatus.IN_MOTORI,
  [DepartmentType.OTHER]: ODLStatus.IN_CLEANROOM // Fallback
}

/**
 * Mappa tipo reparto -> stato EXIT
 */
export const DEPARTMENT_EXIT_STATUS: Record<DepartmentType, ODLStatus> = {
  [DepartmentType.CLEANROOM]: ODLStatus.CLEANROOM_COMPLETED,
  [DepartmentType.AUTOCLAVE]: ODLStatus.AUTOCLAVE_COMPLETED,
  [DepartmentType.HONEYCOMB]: ODLStatus.HONEYCOMB_COMPLETED,
  [DepartmentType.CONTROLLO_NUMERICO]: ODLStatus.CONTROLLO_NUMERICO_COMPLETED,
  [DepartmentType.NDI]: ODLStatus.NDI_COMPLETED,
  [DepartmentType.MONTAGGIO]: ODLStatus.MONTAGGIO_COMPLETED,
  [DepartmentType.VERNICIATURA]: ODLStatus.VERNICIATURA_COMPLETED,
  [DepartmentType.CONTROLLO_QUALITA]: ODLStatus.CONTROLLO_QUALITA_COMPLETED,
  [DepartmentType.MOTORI]: ODLStatus.MOTORI_COMPLETED,
  [DepartmentType.OTHER]: ODLStatus.CLEANROOM_COMPLETED // Fallback
}

/**
 * Verifica se una transizione di stato è valida
 */
export function isValidStatusTransition(currentStatus: ODLStatus, targetStatus: ODLStatus): boolean {
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || []
  return validTransitions.includes(targetStatus)
}

/**
 * Verifica se uno stato è compatibile con un tipo di reparto per ENTRY
 */
export function isValidDepartmentEntry(currentStatus: ODLStatus, departmentType: DepartmentType): boolean {
  const targetStatus = DEPARTMENT_ENTRY_STATUS[departmentType]
  return isValidStatusTransition(currentStatus, targetStatus)
}

/**
 * Verifica se uno stato è compatibile con un tipo di reparto per EXIT
 */
export function isValidDepartmentExit(currentStatus: ODLStatus, departmentType: DepartmentType): boolean {
  const targetStatus = DEPARTMENT_EXIT_STATUS[departmentType]
  return isValidStatusTransition(currentStatus, targetStatus)
}

/**
 * Ottiene i possibili stati successivi per un ODL
 */
export function getValidNextStatuses(currentStatus: ODLStatus): ODLStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Ottiene il motivo per cui una transizione non è valida
 */
export function getTransitionErrorMessage(currentStatus: ODLStatus, targetStatus: ODLStatus): string {
  if (isValidStatusTransition(currentStatus, targetStatus)) {
    return 'Transizione valida'
  }
  
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || []
  
  if (validTransitions.length === 0) {
    return `ODL in stato ${currentStatus} è in stato finale e non può essere modificato`
  }
  
  return `Transizione da ${currentStatus} a ${targetStatus} non valida. Stati validi: ${validTransitions.join(', ')}`
}