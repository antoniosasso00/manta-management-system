import { SyncStatus } from '@prisma/client'

export interface PartEntity {
  id: string
  partNumber: string
  description: string
  createdAt: Date
  updatedAt: Date
  
  // Gamma MES sync tracking
  gammaId?: string | null
  lastSyncAt?: Date | null
  syncStatus: SyncStatus
  
  // Production specifications removed - use Tool dimensions via PartTool relation
  
  // Relations
  partTools?: PartToolRelation[]
  _count?: {
    odls: number
  }
}

interface PartToolRelation {
  id: string
  toolId: string
  tool: {
    id: string
    toolPartNumber: string
    description?: string
    base: number
    height: number
    weight?: number
  }
}

export class Part implements PartEntity {
  public readonly id: string
  public readonly partNumber: string
  public description: string
  public readonly createdAt: Date
  public updatedAt: Date
  
  // Gamma MES sync tracking
  public gammaId?: string | null
  public lastSyncAt?: Date | null
  public syncStatus: SyncStatus
  
  // Production specifications removed - use Tool dimensions via PartTool relation
  
  // Relations
  public partTools?: PartToolRelation[]
  public _count?: {
    odls: number
  }

  constructor(data: PartEntity) {
    this.id = data.id
    this.partNumber = data.partNumber
    this.description = data.description
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.gammaId = data.gammaId
    this.lastSyncAt = data.lastSyncAt
    this.syncStatus = data.syncStatus
    // Production specifications removed - use Tool dimensions via PartTool relation
    this.partTools = data.partTools
    this._count = data._count
  }

  // Business methods
  public updateDescription(newDescription: string): void {
    this.description = newDescription
    this.markAsUpdated()
  }

  // Production specifications removed - use Tool dimensions via PartTool relation
  // Method removed as dimensions are now managed via Tool entities

  public markAsSynced(gammaId?: string): void {
    this.lastSyncAt = new Date()
    this.syncStatus = SyncStatus.SUCCESS
    if (gammaId) {
      this.gammaId = gammaId
    }
    this.markAsUpdated()
  }

  public markSyncFailed(): void {
    this.syncStatus = SyncStatus.FAILED
    this.markAsUpdated()
  }

  public hasDimensions(): boolean {
    return !!(this.partTools && this.partTools.length > 0 && this.partTools[0].tool)
  }

  public hasProductionSpecs(): boolean {
    return !!(this.partTools && this.partTools.length > 0)
  }

  public isFromGamma(): boolean {
    return !!this.gammaId
  }

  private markAsUpdated(): void {
    this.updatedAt = new Date()
  }

  // Static factory methods
  static create(data: Omit<PartEntity, 'id' | 'createdAt' | 'updatedAt'>): Part {
    const now = new Date()
    return new Part({
      id: '', // Will be set by repository
      createdAt: now,
      updatedAt: now,
      ...data,
      syncStatus: SyncStatus.SUCCESS,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromPrisma(data: any): Part { // TODO: Replace with proper Prisma type
    return new Part(data)
  }
}