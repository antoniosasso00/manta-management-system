// Tipi base comuni per tutte le tabelle di estensione
export interface ExtensionTableConfig {
  entityName: string
  displayName: string
  description: string
  apiEndpoint: string
  fields: ExtensionField[]
  stats?: StatsConfig[]
  actions?: ExtensionTableActions
}

export interface ExtensionField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiline' | 'autocomplete' | 'boolean' | 'time'
  required?: boolean
  options?: Array<{ value: string; label: string }>
  helperText?: string
  min?: number
  max?: number
  rows?: number
  unit?: string
  icon?: string
  validation?: (value: any) => string | null
  disabled?: boolean
  defaultValue?: any
}

export interface StatsConfig {
  label: string
  value: string | ((data: any[]) => string | number)
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  icon?: string
}

export interface ExtensionTableActions {
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canImport?: boolean
  canExport?: boolean
  customActions?: Array<{
    label: string
    icon?: string
    onClick: (item: any) => void
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  }>
}

// Interfacce specifiche per ogni tabella di estensione
export interface PartAutoclaveExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  curingCycleId: string
  curingCycle: { id: string; code: string; name: string }
  vacuumLines: number
  setupTime?: number
  loadPosition?: string
  notes?: string
}

export interface PartCleanroomExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  layupSequence: string
  fiberOrientation: string
  resinType: string
  prepregCode: string
  roomTemperature: number
  humidity: number
  shelfLife: number
  setupTime?: number
  cycleTime?: number
}

export interface PartNDIExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  inspectionMethod: string
  acceptanceCriteria: string
  criticalAreas: string
  inspectionTime: number
  requiredCerts: string
  calibrationReq: boolean
}

export interface PartHoneycombExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  coreType: string
  cellSize: string
  coreDensity: number
  coreThickness: number
  skinMaterial: string
  adhesiveType: string
  cureTemperature: number
  cureTime: number
  pressure: number
  vacuumLevel: number
  qualityChecks: string
  notes?: string
}

export interface PartControlloNumericoExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  materialType: string
  toolingRequired: string
  programmingTime: number
  setupTime: number
  cycleTime: number
  toleranceClass: string
  surfaceFinish: string
  qualityChecks: string
  notes?: string
}

export interface PartMontaggioExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  assemblyType: string
  componentCount: number
  assemblyTime: number
  testingTime: number
  requiredParts: string
  toolsRequired: string
  qualityChecks: string
  certificationReq: boolean
  notes?: string
}

export interface PartVerniciatureExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  coatingType: string
  primerRequired: boolean
  coatLayers: number
  surfacePrep: string
  cleaningRequired: boolean
  dryTime: number
  cureTime: number
  qualityChecks: string
  environmentalReq: string
  notes?: string
}

export interface PartMotoriExtension {
  id: string
  partId: string
  part: { id: string; partNumber: string; description: string }
  engineType: string
  powerRating: number
  rpmRange: string
  fuelType: string
  assemblyTime: number
  testingTime: number
  certificationReq: boolean
  qualityChecks: string
  maintenanceReq: string
  notes?: string
}

export type ExtensionTableData = 
  | PartAutoclaveExtension 
  | PartCleanroomExtension 
  | PartNDIExtension 
  | PartHoneycombExtension 
  | PartControlloNumericoExtension 
  | PartMontaggioExtension 
  | PartVerniciatureExtension 
  | PartMotoriExtension

// Tipo per le opzioni comuni
export interface CommonSelectOptions {
  parts: Array<{ id: string; partNumber: string; description: string }>
  curingCycles?: Array<{ id: string; code: string; name: string }>
}