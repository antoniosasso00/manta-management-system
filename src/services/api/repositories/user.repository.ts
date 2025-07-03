import { ValidatedRepository } from '../repository'
import { z } from 'zod'
import { USER_ROLES, DEPARTMENT_ROLES } from '@/utils/constants'
import type { UserRole, DepartmentRole } from '@/utils/constants'

// User schemas
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.nativeEnum(USER_ROLES),
  departmentId: z.string().nullable(),
  departmentRole: z.nativeEnum(DEPARTMENT_ROLES).nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLogin: z.string().datetime().nullable()
})

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.nativeEnum(USER_ROLES),
  departmentId: z.string().optional(),
  departmentRole: z.nativeEnum(DEPARTMENT_ROLES).optional()
})

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.nativeEnum(USER_ROLES).optional(),
  departmentId: z.string().nullable().optional(),
  departmentRole: z.nativeEnum(DEPARTMENT_ROLES).nullable().optional(),
  isActive: z.boolean().optional()
})

export type User = z.infer<typeof userSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export class UserRepository extends ValidatedRepository<User, CreateUserInput, UpdateUserInput> {
  constructor() {
    super(
      {
        baseUrl: '/api/admin/users'
      },
      {
        entity: userSchema,
        create: createUserSchema,
        update: updateUserSchema
      }
    )
  }

  // User-specific methods
  async getByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getAll({ email })
      return users[0] || null
    } catch {
      return null
    }
  }

  async getByRole(role: UserRole): Promise<User[]> {
    return this.getAll({ role })
  }

  async getByDepartment(departmentId: string): Promise<User[]> {
    return this.getAll({ departmentId })
  }

  async getActive(): Promise<User[]> {
    return this.getAll({ isActive: true })
  }

  async toggleActive(id: string): Promise<User> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}/toggle-active`, {
      method: 'PATCH'
    })
    return this.handleResponse<User>(response)
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await this.fetchWithTimeout(`${this.baseUrl}/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword })
    })
  }

  async assignDepartment(
    userId: string, 
    departmentId: string, 
    departmentRole: DepartmentRole
  ): Promise<User> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${userId}/department`, {
      method: 'PUT',
      body: JSON.stringify({ departmentId, departmentRole })
    })
    return this.handleResponse<User>(response)
  }

  async removeDepartment(userId: string): Promise<User> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${userId}/department`, {
      method: 'DELETE'
    })
    return this.handleResponse<User>(response)
  }

  async getUserStats(): Promise<{
    total: number
    active: number
    byRole: Record<string, number>
    byDepartment: Record<string, number>
  }> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/stats`)
    return this.handleResponse(response)
  }
}

// Singleton instance
export const userRepository = new UserRepository()