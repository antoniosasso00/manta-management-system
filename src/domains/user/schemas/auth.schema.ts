import { z } from 'zod'
import { passwordSchema } from '@/lib/password-validation'

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido')
    .toLowerCase()
    .refine((email) => {
      // Additional email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(email)
    }, 'Formato email non valido'),
  password: z.string()
    .min(1, 'Password richiesta')
    .min(3, 'Password troppo corta'),
})

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido')
    .toLowerCase()
    .refine((email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(email)
    }, 'Formato email non valido'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Conferma password richiesta'),
  name: z.string()
    .min(1, 'Nome richiesto')
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(50, 'Il nome non può superare 50 caratteri'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>