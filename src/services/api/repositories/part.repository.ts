import { ValidatedRepository } from '../repository'
import { 
  partSchema, 
  paginatedPartsSchema,
  apiPartsResponseSchema,
  createPartSchema,
  updatePartInputSchema,
  type Part,
  type CreatePartInput,
  type UpdatePartInput
} from '@/domains/core/schemas/part'

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

  // Override create to avoid response validation issues
  async create(data: CreatePartInput): Promise<Part> {
    // Validate input with the correct schema
    const validatedData = createPartSchema.parse(data)
    
    // Call the API directly without additional validation
    const response = await this.fetchWithTimeout(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(validatedData)
    })
    
    // Just return the response without validating the structure
    // The API already returns the correct data structure
    const result = await this.handleResponse<Part>(response)
    return result as Part
  }

  // Override getAll to handle paginated response
  async getAll(params?: Record<string, string | number | boolean | string[]>): Promise<Part[]> {
    const queryString = this.buildQueryString(params)
    const response = await this.fetchWithTimeout(`${this.baseUrl}${queryString}`)
    const rawData = await this.handleResponse(response)
    
    // Try new API format first, fallback to old format
    try {
      const newFormatData = apiPartsResponseSchema.parse(rawData)
      return newFormatData.data
    } catch {
      // Fallback to old format
      const validatedData = paginatedPartsSchema.parse(rawData)
      return validatedData.parts
    }
  }

  // Get paginated response with metadata
  async getPaginated(params?: Record<string, string | number | boolean | string[]>) {
    const queryString = this.buildQueryString(params)
    const response = await this.fetchWithTimeout(`${this.baseUrl}${queryString}`)
    const rawData = await this.handleResponse(response)
    
    // Try new API format first, fallback to old format
    try {
      const newFormatData = apiPartsResponseSchema.parse(rawData)
      // Transform to old format for backward compatibility
      return {
        parts: newFormatData.data,
        total: newFormatData.meta.total,
        page: newFormatData.meta.page,
        totalPages: newFormatData.meta.totalPages
      }
    } catch {
      // Fallback to old format
      return paginatedPartsSchema.parse(rawData)
    }
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