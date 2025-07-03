// User roles (system-level)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  OPERATOR: 'OPERATOR',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Department roles (department-specific)
export const DEPARTMENT_ROLES = {
  CAPO_REPARTO: 'CAPO_REPARTO',
  CAPO_TURNO: 'CAPO_TURNO',
  OPERATORE: 'OPERATORE',
} as const

export type DepartmentRole = typeof DEPARTMENT_ROLES[keyof typeof DEPARTMENT_ROLES]

// Role display names (Italian)
export const ROLE_DISPLAY_NAMES = {
  // System roles
  ADMIN: 'Amministratore',
  SUPERVISOR: 'Supervisore',
  OPERATOR: 'Operatore',
  
  // Department roles
  CAPO_REPARTO: 'Capo Reparto',
  CAPO_TURNO: 'Capo Turno',
  OPERATORE: 'Operatore Reparto',
} as const

// ODL Status
export const ODL_STATUS = {
  CREATED: 'CREATED',
  // Honeycomb processing
  IN_HONEYCOMB: 'IN_HONEYCOMB',
  HONEYCOMB_COMPLETED: 'HONEYCOMB_COMPLETED',
  // Clean room processing
  IN_CLEANROOM: 'IN_CLEANROOM',
  CLEANROOM_COMPLETED: 'CLEANROOM_COMPLETED',
  // CNC processing
  IN_CONTROLLO_NUMERICO: 'IN_CONTROLLO_NUMERICO',
  CONTROLLO_NUMERICO_COMPLETED: 'CONTROLLO_NUMERICO_COMPLETED',
  // Assembly processing
  IN_MONTAGGIO: 'IN_MONTAGGIO',
  MONTAGGIO_COMPLETED: 'MONTAGGIO_COMPLETED',
  // Autoclave processing
  IN_AUTOCLAVE: 'IN_AUTOCLAVE',
  AUTOCLAVE_COMPLETED: 'AUTOCLAVE_COMPLETED',
  // NDI processing
  IN_NDI: 'IN_NDI',
  NDI_COMPLETED: 'NDI_COMPLETED',
  // Coating processing
  IN_VERNICIATURA: 'IN_VERNICIATURA',
  VERNICIATURA_COMPLETED: 'VERNICIATURA_COMPLETED',
  // Motor processing
  IN_MOTORI: 'IN_MOTORI',
  MOTORI_COMPLETED: 'MOTORI_COMPLETED',
  // Quality control
  IN_CONTROLLO_QUALITA: 'IN_CONTROLLO_QUALITA',
  CONTROLLO_QUALITA_COMPLETED: 'CONTROLLO_QUALITA_COMPLETED',
  // Final states
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
} as const

// Production shifts
export const PRODUCTION_SHIFTS = {
  MORNING: { start: '06:00', end: '14:00', name: 'Morning (6-14)' },
  AFTERNOON: { start: '14:00', end: '22:00', name: 'Afternoon (14-22)' },
} as const

// Department types
export const DEPARTMENT_TYPES = {
  HONEYCOMB: 'HONEYCOMB',
  CLEANROOM: 'CLEANROOM',
  CONTROLLO_NUMERICO: 'CONTROLLO_NUMERICO',
  MONTAGGIO: 'MONTAGGIO',
  AUTOCLAVE: 'AUTOCLAVE',
  NDI: 'NDI',
  VERNICIATURA: 'VERNICIATURA',
  MOTORI: 'MOTORI',
  CONTROLLO_QUALITA: 'CONTROLLO_QUALITA',
  OTHER: 'OTHER',
} as const

// Department display names (Italian)
export const DEPARTMENT_DISPLAY_NAMES = {
  HONEYCOMB: 'Honeycomb',
  CLEANROOM: 'Clean Room',
  CONTROLLO_NUMERICO: 'Controllo Numerico',
  MONTAGGIO: 'Montaggio',
  AUTOCLAVE: 'Autoclavi',
  NDI: 'NDI',
  VERNICIATURA: 'Verniciatura',
  MOTORI: 'Motori',
  CONTROLLO_QUALITA: 'Controllo Qualità',
  OTHER: 'Altro',
} as const

// Department codes (Short)
export const DEPARTMENT_CODES = {
  HONEYCOMB: 'HC',
  CLEANROOM: 'CR',
  CONTROLLO_NUMERICO: 'CN',
  MONTAGGIO: 'RM',
  AUTOCLAVE: 'AC',
  NDI: 'ND',
  VERNICIATURA: 'VR',
  MOTORI: 'MT',
  CONTROLLO_QUALITA: 'CQ',
  OTHER: 'OT',
} as const

// Event types
export const EVENT_TYPES = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  NOTE: 'NOTE',
} as const

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

// QR Code configuration
export const QR_CONFIG = {
  SIZE: 200,
  ERROR_CORRECTION_LEVEL: 'M' as const,
  TYPE: 'image/png' as const,
  MARGIN: 4,
}

// Autoclave constraints
export const AUTOCLAVE_CONSTRAINTS = {
  MAX_OPTIMIZATION_TIME: 30, // seconds
  MIN_VACUUM_LINES: 1,
  MAX_VACUUM_LINES: 10,
  UTILIZATION_TARGET: 0.85, // 85% space utilization target
}

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/signin',
    LOGOUT: '/api/auth/signout',
    REGISTER: '/api/auth/register',
  },
  ODLS: '/api/odls',
  DEPARTMENTS: '/api/departments',
  AUTOCLAVES: '/api/autoclaves',
  PRODUCTION_EVENTS: '/api/production-events',
  QR_GENERATE: '/api/qr/generate',
  QR_SCAN: '/api/qr/scan',
} as const