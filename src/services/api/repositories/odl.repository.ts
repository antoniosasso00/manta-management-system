import { ValidatedRepository } from '../repository'
import { 
  odlSchema, 
  createODLSchema, 
  updateODLSchema,
  type ODL,
  type CreateODLInput,
  type UpdateODLInput
} from '@/domains/core/schemas/odl'

export class ODLRepository extends ValidatedRepository<ODL, CreateODLInput, UpdateODLInput> {
  constructor() {
    super(
      {
        baseUrl: '/api/odl'
      },
      {
        entity: odlSchema,
        create: createODLSchema,
        update: updateODLSchema
      }
    )
  }

  // ODL-specific methods
  async getByStatus(status: string): Promise<ODL[]> {
    return this.getAll({ status })
  }

  async getByDepartment(departmentId: string): Promise<ODL[]> {
    return this.getAll({ departmentId })
  }

  async getByPartNumber(partNumber: string): Promise<ODL[]> {
    return this.getAll({ partNumber })
  }

  async getActive(): Promise<ODL[]> {
    return this.getAll({ active: true })
  }

  async updateStatus(id: string, status: string): Promise<ODL> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    return this.handleResponse<ODL>(response)
  }

  async assignOperator(odlId: string, operatorId: string): Promise<ODL> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${odlId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ operatorId })
    })
    return this.handleResponse<ODL>(response)
  }

  async generateQRCode(odlId: string): Promise<{ qrCode: string }> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/${odlId}/qr-code`, {
      method: 'POST'
    })
    return this.handleResponse<{ qrCode: string }>(response)
  }
}

// Singleton instance
export const odlRepository = new ODLRepository()