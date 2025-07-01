// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  OPERATOR: 'OPERATOR',
} as const

// ODL Status
export const ODL_STATUS = {
  CREATED: 'CREATED',
  IN_CLEANROOM: 'IN_CLEANROOM',
  CLEANROOM_COMPLETED: 'CLEANROOM_COMPLETED',
  IN_AUTOCLAVE: 'IN_AUTOCLAVE',
  AUTOCLAVE_COMPLETED: 'AUTOCLAVE_COMPLETED',
  IN_NDI: 'IN_NDI',
  IN_RIFILATURA: 'IN_RIFILATURA',
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
  CLEANROOM: 'CLEANROOM',
  AUTOCLAVE: 'AUTOCLAVE',
  NDI: 'NDI',
  RIFILATURA: 'RIFILATURA',
  OTHER: 'OTHER',
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