import { Priority, ODLStatus, SyncStatus } from '@prisma/client'
import { Part } from './Part'

export interface ODLEntity {
  id: string
  odlNumber: string
  partId: string
  quantity: number
  priority: Priority
  status: ODLStatus
  qrCode: string
  createdAt: Date
  updatedAt: Date
  
  // Gamma MES sync tracking
  gammaId?: string | null
  lastSyncAt?: Date | null
  syncStatus: SyncStatus
  
  // Override dimensions (if different from part standard)
  length?: number | null
  width?: number | null
  height?: number | null
  
  // Override production data (if different from part standard)
  curingCycle?: string | null
  vacuumLines?: number | null
  
  // Relations
  part?: Part
}

export class ODL implements ODLEntity {
  public readonly id: string
  public readonly odlNumber: string
  public readonly partId: string
  public quantity: number
  public priority: Priority
  public status: ODLStatus
  public readonly qrCode: string
  public readonly createdAt: Date
  public updatedAt: Date
  
  // Gamma MES sync tracking
  public gammaId?: string | null
  public lastSyncAt?: Date | null
  public syncStatus: SyncStatus
  
  // Override dimensions
  public length?: number | null
  public width?: number | null
  public height?: number | null
  
  // Override production data
  public curingCycle?: string | null
  public vacuumLines?: number | null
  
  // Relations
  public part?: Part

  constructor(data: ODLEntity) {
    this.id = data.id
    this.odlNumber = data.odlNumber
    this.partId = data.partId
    this.quantity = data.quantity
    this.priority = data.priority
    this.status = data.status
    this.qrCode = data.qrCode
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.gammaId = data.gammaId
    this.lastSyncAt = data.lastSyncAt
    this.syncStatus = data.syncStatus
    this.length = data.length
    this.width = data.width
    this.height = data.height
    this.curingCycle = data.curingCycle
    this.vacuumLines = data.vacuumLines
    this.part = data.part
  }

  // Business methods
  public updateQuantity(newQuantity: number): void {
    if (newQuantity < 1) {
      throw new Error('Quantity must be at least 1')
    }
    this.quantity = newQuantity
    this.markAsUpdated()
  }

  public setPriority(priority: Priority): void {
    this.priority = priority
    this.markAsUpdated()
  }

  public startCleanRoom(): void {
    if (this.status !== ODLStatus.CREATED) {
      throw new Error(`Cannot start clean room for ODL with status ${this.status}`)
    }
    this.status = ODLStatus.IN_CLEANROOM
    this.markAsUpdated()
  }

  public completeCleanRoom(): void {
    if (this.status !== ODLStatus.IN_CLEANROOM) {
      throw new Error(`Cannot complete clean room for ODL with status ${this.status}`)
    }
    this.status = ODLStatus.CLEANROOM_COMPLETED
    this.markAsUpdated()
  }

  public startAutoclave(): void {
    if (this.status !== ODLStatus.CLEANROOM_COMPLETED) {
      throw new Error(`Cannot start autoclave for ODL with status ${this.status}`)
    }
    this.status = ODLStatus.IN_AUTOCLAVE
    this.markAsUpdated()
  }

  public completeAutoclave(): void {
    if (this.status !== ODLStatus.IN_AUTOCLAVE) {
      throw new Error(`Cannot complete autoclave for ODL with status ${this.status}`)
    }
    this.status = ODLStatus.AUTOCLAVE_COMPLETED
    this.markAsUpdated()
  }

  public hold(): void {
    if (this.status === ODLStatus.COMPLETED || this.status === ODLStatus.CANCELLED) {
      throw new Error(`Cannot hold ODL with status ${this.status}`)
    }
    this.status = ODLStatus.ON_HOLD
    this.markAsUpdated()
  }

  public cancel(): void {
    if (this.status === ODLStatus.COMPLETED) {
      throw new Error('Cannot cancel completed ODL')
    }
    this.status = ODLStatus.CANCELLED
    this.markAsUpdated()
  }

  public complete(): void {
    this.status = ODLStatus.COMPLETED
    this.markAsUpdated()
  }

  public updateDimensions(dimensions: {
    length?: number
    width?: number
    height?: number
  }): void {
    this.length = dimensions.length ?? null
    this.width = dimensions.width ?? null
    this.height = dimensions.height ?? null
    this.markAsUpdated()
  }

  public updateProductionData(data: {
    curingCycle?: string
    vacuumLines?: number
  }): void {
    this.curingCycle = data.curingCycle ?? null
    this.vacuumLines = data.vacuumLines ?? null
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

  // Getters for effective values (considering part defaults)
  public getEffectiveLength(): number | null {
    return this.length ?? this.part?.standardLength ?? null
  }

  public getEffectiveWidth(): number | null {
    return this.width ?? this.part?.standardWidth ?? null
  }

  public getEffectiveHeight(): number | null {
    return this.height ?? this.part?.standardHeight ?? null
  }

  public getEffectiveCuringCycle(): string | null {
    return this.curingCycle ?? this.part?.defaultCuringCycle ?? null
  }

  public getEffectiveVacuumLines(): number | null {
    return this.vacuumLines ?? this.part?.defaultVacuumLines ?? null
  }

  public hasEffectiveDimensions(): boolean {
    return !!(this.getEffectiveLength() && this.getEffectiveWidth() && this.getEffectiveHeight())
  }

  public isInProduction(): boolean {
    return [
      ODLStatus.IN_CLEANROOM,
      ODLStatus.CLEANROOM_COMPLETED,
      ODLStatus.IN_AUTOCLAVE,
      ODLStatus.AUTOCLAVE_COMPLETED,
      ODLStatus.IN_NDI,
    ].includes(this.status as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  public isCompleted(): boolean {
    return this.status === ODLStatus.COMPLETED
  }

  public isFromGamma(): boolean {
    return !!this.gammaId
  }

  private markAsUpdated(): void {
    this.updatedAt = new Date()
  }

  // Static factory methods
  static create(data: Omit<ODLEntity, 'id' | 'createdAt' | 'updatedAt' | 'qrCode' | 'status'>): ODL {
    const now = new Date()
    return new ODL({
      id: '', // Will be set by repository
      createdAt: now,
      updatedAt: now,
      qrCode: '', // Will be generated by repository
      status: ODLStatus.CREATED,
      ...data,
      syncStatus: SyncStatus.SUCCESS,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromPrisma(data: any): ODL { // TODO: Replace with proper Prisma type
    return new ODL({
      ...data,
      part: data.part ? Part.fromPrisma(data.part) : undefined,
    })
  }
}