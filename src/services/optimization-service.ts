import { z } from 'zod';

// Configurazione
const OPTIMIZATION_SERVICE_URL = process.env.NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL || 'http://localhost:8000/api/v1';

// Types
export interface OptimizationConstraints {
  min_border_distance: number;
  min_tool_distance: number;
  allow_rotation: boolean;
}

export interface ToolData {
  id: string;
  width: number;
  height: number;
  weight: number;
}

export interface ODLData {
  id: string;
  odl_number: string;
  part_number: string;
  curing_cycle: string;
  vacuum_lines: number;
  tools: ToolData[];
}

export interface AutoclaveData {
  id: string;
  code: string;
  width: number;
  height: number;
  vacuum_lines: number;
  max_weight?: number;
}

export interface CycleGroup {
  cycle_code: string;
  odl_count: number;
  total_area: number;
  optimization_score: number;
  odl_ids: string[];
}

export interface AutoclaveSuggestion {
  cycle_code: string;
  suggested_autoclave_id: string;
  suggested_autoclave_code: string;
  reason: string;
  odl_count: number;
  total_area: number;
}

export interface ElevatedTool {
  odl_id: string;
  tool_id: string;
  width: number;
  height: number;
  aspect_ratio: number;
  area: number;
  recommendation: 'ELEVATE' | 'GROUND';
}

export interface Placement {
  odl_id: string;
  odl_number: string;
  part_number: string;
  part_description?: string;
  tool_id: string;
  tool_name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  level: number;
  coordinates_text: string;
}

export interface BatchMetrics {
  area_efficiency: number;
  total_weight: number;
  vacuum_lines_used: number;
  odl_count: number;
  tool_count: number;
  wasted_area: number;
}

export interface BatchLayout {
  batch_id: string;
  autoclave_id: string;
  autoclave_code: string;
  autoclave_dimensions?: {
    width: number;
    height: number;
  };
  curing_cycle: string;
  curing_cycle_description?: string;
  curing_time_minutes?: number;
  placements: Placement[];
  metrics: BatchMetrics;
  status: 'DRAFT' | 'READY' | 'IN_CURE' | 'COMPLETED' | 'RELEASED' | 'CANCELLED';
  layout_image_base64?: string;
}

export interface BatchEfficiencyInfo {
  batch_id: string;
  efficiency: number;
  odl_count: number;
  is_recommended: boolean;
}

export interface OptimizationResult {
  optimization_id: string;
  batches: BatchLayout[];
  total_odls_placed: number;
  total_odls_input: number;
  success_rate: number;
  execution_time_seconds: number;
  batches_by_efficiency?: BatchEfficiencyInfo[];
}

// API Service
export class OptimizationService {
  private static async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${OPTIMIZATION_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Step 1: Analizza ODL e suggerisce cicli di cura ottimali
   */
  static async analyzeCycles(params: {
    odls: ODLData[];
    autoclaves: AutoclaveData[];
    constraints?: OptimizationConstraints;
  }): Promise<{
    cycle_groups: CycleGroup[];
    recommendations: string[];
    autoclave_suggestions?: Record<string, AutoclaveSuggestion>;
  }> {
    return this.fetchApi('/optimization/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Step 2: Analizza quali tool posizionare su supporti rialzati
   */
  static async analyzeElevatedTools(params: {
    odls: ODLData[];
    autoclaves: AutoclaveData[];
    constraints?: OptimizationConstraints;
  }): Promise<{
    elevated_tools: ElevatedTool[];
    total_elevated: number;
    space_saved_percentage: number;
  }> {
    return this.fetchApi('/optimization/analyze-elevated', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Step 3: Esegue ottimizzazione completa
   */
  static async executeOptimization(params: {
    odls: ODLData[];
    autoclaves: AutoclaveData[];
    selected_cycles: string[];
    elevated_tools: string[];
    constraints?: OptimizationConstraints;
    autoclave_assignments?: Record<string, string>;
  }): Promise<OptimizationResult> {
    return this.fetchApi('/optimization/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Esporta batch in PDF
   */
  static async exportBatchPDF(batchId: string): Promise<{
    filename: string;
    content_base64: string;
    content_type: string;
  }> {
    return this.fetchApi(`/optimization/batch/${batchId}/export/pdf`);
  }

  /**
   * Esporta batch in DXF
   */
  static async exportBatchDXF(batchId: string): Promise<{
    filename: string;
    content: string;
    content_type: string;
  }> {
    return this.fetchApi(`/optimization/batch/${batchId}/export/dxf`);
  }

  /**
   * Health check del servizio
   */
  static async checkHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
  }> {
    return this.fetchApi('/health');
  }
}

// Helper per convertire dati dal database
export function convertODLToOptimizationData(odl: any): ODLData {
  // Ottieni dati SOLO da configurazione reparto-specifica
  const autoclaveConfig = odl.part.autoclaveConfig;
  if (!autoclaveConfig) {
    throw new Error(`Part ${odl.part.partNumber} manca configurazione autoclave`);
  }

  return {
    id: odl.id,
    odl_number: odl.odlNumber,
    part_number: odl.part.partNumber,
    curing_cycle: autoclaveConfig.curingCycle.code,
    vacuum_lines: autoclaveConfig.vacuumLines,
    tools: odl.part.partTools.map((pt: any) => ({
      id: pt.tool.id,
      // MAPPING CORRETTO: base = larghezza (X), height = lunghezza (Y)
      width: pt.tool.base || 0,      // base del tool = larghezza
      height: pt.tool.height || 0,   // height del tool = lunghezza  
      weight: pt.tool.weight || 0,
    })),
  };
}

export function convertAutoclaveToOptimizationData(autoclave: any): AutoclaveData {
  return {
    id: autoclave.id,
    code: autoclave.code,
    width: autoclave.maxWidth,
    height: autoclave.maxLength,
    vacuum_lines: autoclave.vacuumLines,
    max_weight: autoclave.maxWeight,
  };
}