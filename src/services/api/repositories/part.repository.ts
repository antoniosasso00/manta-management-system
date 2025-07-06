import { ValidatedRepository } from '../repository'
import { 
  partSchema, 
  paginatedPartsSchema,
  type Part
} from '@/domains/core/schemas/part'
import {
  createPartSchema,
  updatePartInputSchema,
  type CreatePartInput,
  type UpdatePartInput
} from '@/domains/core/schemas/part.schema'

export class PartRepository extends ValidatedRepository<Part, CreatePartInput, UpdatePartInput> {
  constructor() {
    super(
      {
        baseUrl: '/api/parts'
      },
      {
        entity: partSchema,
        create: createPartSchema,
        update: updatePartInputSchema
      }
    )
  }

  // Override getAll to handle paginated response
  async getAll(params?: Record<string, string | number | boolean | string[]>): Promise<Part[]> {
    const queryString = this.buildQueryString(params)
    const response = await this.fetchWithTimeout(`${this.baseUrl}${queryString}`)
    const data = await this.handleResponse(response)
    const validatedData = paginatedPartsSchema.parse(data)
    return validatedData.parts
  }

  // Get paginated response with metadata
  async getPaginated(params?: Record<string, string | number | boolean | string[]>) {
    const queryString = this.buildQueryString(params)
    const response = await this.fetchWithTimeout(`${this.baseUrl}${queryString}`)
    const data = await this.handleResponse(response)
    return paginatedPartsSchema.parse(data)
  }

  // Part-specific methods
  async getByPartNumber(partNumber: string): Promise<Part | null> {
    try {
      const parts = await this.getAll({ partNumber })
      return parts[0] || null
    } catch {
      return null
    }
  }

  async searchByDescription(query: string): Promise<Part[]> {
    return this.getAll({ search: query })
  }

  async getActive(): Promise<Part[]> {
    return this.getAll({ isActive: true })
  }

  async getByCuringCycle(curingCycleId: string): Promise<Part[]> {
    return this.getAll({ curingCycleId })
  }

  async toggleActive(id: string): Promise<Part> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}/toggle-active`, {
      method: 'PATCH'
    })
    return this.handleResponse<Part>(response)
  }

  async updateTools(partId: string, toolIds: string[]): Promise<Part> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${partId}/tools`, {
      method: 'PUT',
      body: JSON.stringify({ toolIds })
    })
    return this.handleResponse<Part>(response)
  }

  async importFromFile(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.fetchWithTimeout(`${this.baseUrl}/import`, {
      method: 'POST',
      headers: {
        // Remove Content-Type to let browser set it with boundary for multipart
        ...Object.fromEntries(
          Object.entries(this.headers).filter(([key]) => key !== 'Content-Type')
        )
      },
      body: formData
    })
    
    return this.handleResponse<{ imported: number; errors: string[] }>(response)
  }
}

// Singleton instance
export const partRepository = new PartRepository()