import { z } from 'zod'

/**
 * Unified password policy for the entire application
 * Ensures consistency across registration, reset, and change password flows
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
} as const

/**
 * Unified password schema used across all authentication flows
 */
export const passwordSchema = z.string()
  .min(PASSWORD_REQUIREMENTS.minLength, `La password deve contenere almeno ${PASSWORD_REQUIREMENTS.minLength} caratteri`)
  .regex(/[A-Z]/, 'Deve contenere almeno una lettera maiuscola')
  .regex(/[a-z]/, 'Deve contenere almeno una lettera minuscola')
  .regex(/[0-9]/, 'Deve contenere almeno un numero')
  .regex(/[^A-Za-z0-9]/, 'Deve contenere almeno un carattere speciale')

/**
 * Password confirmation schema for forms requiring password confirmation
 */
export const passwordConfirmationSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
})

/**
 * Check password strength and return detailed feedback
 */
export interface PasswordCheck {
  test: (password: string) => boolean
  label: string
  severity: 'error' | 'warning' | 'success'
}

export const passwordChecks: PasswordCheck[] = [
  {
    test: (pwd: string) => pwd.length >= PASSWORD_REQUIREMENTS.minLength,
    label: `Almeno ${PASSWORD_REQUIREMENTS.minLength} caratteri`,
    severity: 'error'
  },
  {
    test: (pwd: string) => /[A-Z]/.test(pwd),
    label: 'Una lettera maiuscola',
    severity: 'error'
  },
  {
    test: (pwd: string) => /[a-z]/.test(pwd),
    label: 'Una lettera minuscola',
    severity: 'error'
  },
  {
    test: (pwd: string) => /[0-9]/.test(pwd),
    label: 'Un numero',
    severity: 'error'
  },
  {
    test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd),
    label: 'Un carattere speciale',
    severity: 'error'
  },
]

/**
 * Validate password and return validation result
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  checks: Array<PasswordCheck & { passed: boolean }>
} {
  const result = passwordSchema.safeParse(password)
  const checks = passwordChecks.map(check => ({
    ...check,
    passed: check.test(password)
  }))

  return {
    isValid: result.success,
    errors: result.success ? [] : result.error.errors.map(e => e.message),
    checks
  }
}

/**
 * Check password strength level
 */
export function getPasswordStrength(password: string): {
  level: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  // Length scoring
  if (password.length >= 8) score += 2
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  // Complexity scoring
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1
  if (password.length > 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) {
    score += 1
  }

  // Determine level and feedback
  let level: 'weak' | 'medium' | 'strong' | 'very-strong'
  
  if (score < 4) {
    level = 'weak'
    feedback.push('Password troppo debole')
  } else if (score < 6) {
    level = 'medium'
    feedback.push('Password di media sicurezza')
  } else if (score < 8) {
    level = 'strong'
    feedback.push('Password sicura')
  } else {
    level = 'very-strong'
    feedback.push('Password molto sicura')
  }

  // Additional feedback
  if (password.length < 12) {
    feedback.push('Considera di usare almeno 12 caratteri')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Aggiungi caratteri speciali per maggiore sicurezza')
  }

  return { level, score, feedback }
}