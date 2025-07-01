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
  
  // Production specifications
  defaultCuringCycle?: string | null
  standardLength?: number | null
  standardWidth?: number | null
  standardHeight?: number | null
  defaultVacuumLines?: number | null
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
  
  // Production specifications
  public defaultCuringCycle?: string | null
  public standardLength?: number | null
  public standardWidth?: number | null
  public standardHeight?: number | null
  public defaultVacuumLines?: number | null

  constructor(data: PartEntity) {
    this.id = data.id
    this.partNumber = data.partNumber
    this.description = data.description
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.gammaId = data.gammaId
    this.lastSyncAt = data.lastSyncAt
    this.syncStatus = data.syncStatus
    this.defaultCuringCycle = data.defaultCuringCycle
    this.standardLength = data.standardLength
    this.standardWidth = data.standardWidth
    this.standardHeight = data.standardHeight
    this.defaultVacuumLines = data.defaultVacuumLines
  }

  // Business methods
  public updateDescription(newDescription: string): void {
    this.description = newDescription
    this.markAsUpdated()
  }

  public updateProductionSpecs(specs: {
    defaultCuringCycle?: string
    standardLength?: number
    standardWidth?: number
    standardHeight?: number
    defaultVacuumLines?: number
  }): void {
    if (specs.defaultCuringCycle !== undefined) {
      this.defaultCuringCycle = specs.defaultCuringCycle
    }
    if (specs.standardLength !== undefined) {
      this.standardLength = specs.standardLength
    }
    if (specs.standardWidth !== undefined) {
      this.standardWidth = specs.standardWidth
    }
    if (specs.standardHeight !== undefined) {
      this.standardHeight = specs.standardHeight
    }
    if (specs.defaultVacuumLines !== undefined) {
      this.defaultVacuumLines = specs.defaultVacuumLines
    }
    this.markAsUpdated()
  }

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
    return !!(this.standardLength && this.standardWidth && this.standardHeight)
  }

  public hasProductionSpecs(): boolean {
    return !!(this.defaultCuringCycle || this.defaultVacuumLines)
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