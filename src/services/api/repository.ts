import { z } from 'zod'

// Generic repository interface
export interface IRepository<T, CreateDTO, UpdateDTO> {
  getAll(params?: Record<string, string | number | boolean | string[]>): Promise<T[]>
  getById(id: string | number): Promise<T>
  create(data: CreateDTO): Promise<T>
  update(id: string | number, data: UpdateDTO): Promise<T>
  delete(id: string | number): Promise<void>
}

// Base repository configuration
export interface RepositoryConfig {
  baseUrl: string
  headers?: Record<string, string>
  timeout?: number
}

// Error types
export class RepositoryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

// Base repository implementation
export abstract class BaseRepository<T, CreateDTO, UpdateDTO> 
  implements IRepository<T, CreateDTO, UpdateDTO> {
  
  protected baseUrl: string
  protected headers: Record<string, string>
  protected timeout: number

  constructor(protected config: RepositoryConfig) {
    this.baseUrl = config.baseUrl
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    }
    this.timeout = config.timeout || 30000
  }

  // Helper method for fetch with timeout
  protected async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RepositoryError('Request timeout', 408)
      }
      throw error
    }
  }

  // Handle API response
  protected async handleResponse<R>(response: Response): Promise<R> {
    if (!response.ok) {
      let errorData: { message?: string; errors?: Record<string, string[]> } = {}
      try {
        errorData = await response.json()
      } catch {
        // Response might not be JSON
      }

      throw new RepositoryError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData.errors
      )
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as R
    }

    try {
      return await response.json()
    } catch {
      throw new RepositoryError('Invalid JSON response', 500)
    }
  }

  // Build query string from params
  protected buildQueryString(params?: Record<string, string | number | boolean | string[]>): string {
    if (!params || Object.keys(params).length === 0) {
      return ''
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  // CRUD operations
  async getAll(params?: Record<string, string | number | boolean | string[]>): Promise<T[]> {
    const queryString = this.buildQueryString(params)
    const response = await this.fetchWithTimeout(`${this.baseUrl}${queryString}`)
    return this.handleResponse<T[]>(response)
  }

  async getById(id: string | number): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}`)
    return this.handleResponse<T>(response)
  }

  async create(data: CreateDTO): Promise<T> {
    const response = await this.fetchWithTimeout(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return this.handleResponse<T>(response)
  }

  async update(id: string | number, data: UpdateDTO): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return this.handleResponse<T>(response)
  }

  async delete(id: string | number): Promise<void> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })
    await this.handleResponse<void>(response)
  }
}

// Zod-validated repository for type-safe operations
export abstract class ValidatedRepository<
  T,
  CreateDTO,
  UpdateDTO
> extends BaseRepository<T, CreateDTO, UpdateDTO> {
  
  constructor(
    config: RepositoryConfig,
    protected schemas: {
      entity: z.ZodType<T>
      create: z.ZodType<CreateDTO>
      update: z.ZodType<UpdateDTO>
    }
  ) {
    super(config)
  }

  // Override methods to add validation
  async getAll(params?: Record<string, string | number | boolean | string[]>): Promise<T[]> {
    const data = await super.getAll(params)
    return z.array(this.schemas.entity).parse(data)
  }

  async getById(id: string | number): Promise<T> {
    const data = await super.getById(id)
    return this.schemas.entity.parse(data)
  }

  async create(data: CreateDTO): Promise<T> {
    const validatedData = this.schemas.create.parse(data)
    const response = await super.create(validatedData)
    return this.schemas.entity.parse(response)
  }

  async update(id: string | number, data: UpdateDTO): Promise<T> {
    const validatedData = this.schemas.update.parse(data)
    const response = await super.update(id, validatedData)
    return this.schemas.entity.parse(response)
  }
}

// Factory for creating repositories
export function createRepository<T, CreateDTO, UpdateDTO>(
  config: RepositoryConfig
): BaseRepository<T, CreateDTO, UpdateDTO> {
  return new (class extends BaseRepository<T, CreateDTO, UpdateDTO> {})(config)
}

// Factory for creating validated repositories
export function createValidatedRepository<T, CreateDTO, UpdateDTO>(
  config: RepositoryConfig,
  schemas: {
    entity: z.ZodType<T>
    create: z.ZodType<CreateDTO>
    update: z.ZodType<UpdateDTO>
  }
): ValidatedRepository<T, CreateDTO, UpdateDTO> {
  return new (class extends ValidatedRepository<T, CreateDTO, UpdateDTO> {})(
    config,
    schemas
  )
}