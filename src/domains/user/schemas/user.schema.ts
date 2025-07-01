import { z } from 'zod'

// Enum schemas matching Prisma enums
export const userRoleSchema = z.enum(['ADMIN', 'SUPERVISOR', 'OPERATOR'])
export const departmentRoleSchema = z.enum(['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE'])

// Schema per l'aggiornamento dei ruoli utente
export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
  departmentId: z.string().optional().nullable(),
  departmentRole: departmentRoleSchema.optional().nullable(),
}).refine((data) => {
  // Se l'utente è ADMIN, non deve avere assegnazioni di reparto
  if (data.role === 'ADMIN') {
    return !data.departmentId && !data.departmentRole
  }
  
  // Se l'utente è OPERATOR, deve avere un reparto e un ruolo di reparto
  if (data.role === 'OPERATOR') {
    return data.departmentId && data.departmentRole
  }
  
  // SUPERVISOR può avere o non avere assegnazioni di reparto
  return true
}, {
  message: "Configurazione ruoli non valida",
  path: ["role"],
})

// Schema per la creazione di un nuovo utente con ruoli
export const createUserWithRoleSchema = z.object({
  email: z.string().email('Email non valida'),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  role: userRoleSchema,
  departmentId: z.string().optional().nullable(),
  departmentRole: departmentRoleSchema.optional().nullable(),
}).refine((data) => {
  // Stesse regole di validazione dell'update
  if (data.role === 'ADMIN') {
    return !data.departmentId && !data.departmentRole
  }
  
  if (data.role === 'OPERATOR') {
    return data.departmentId && data.departmentRole
  }
  
  return true
}, {
  message: "Configurazione ruoli non valida per il nuovo utente",
  path: ["role"],
})

// Schema per il controllo dei permessi
export const permissionCheckSchema = z.object({
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  departmentId: z.string().optional(),
})

// Type exports
export type UserRole = z.infer<typeof userRoleSchema>
export type DepartmentRole = z.infer<typeof departmentRoleSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type CreateUserWithRoleInput = z.infer<typeof createUserWithRoleSchema>
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>