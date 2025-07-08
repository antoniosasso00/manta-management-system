import { z } from 'zod';

/**
 * Schema di validazione robusta per dati QR Code nel sistema MES Aerospazio
 * Garantisce sicurezza e integrità dei dati scansionati
 */

// Schema base per tutti i QR codes
const BaseQRSchema = z.object({
  type: z.enum(['ODL', 'DEPARTMENT', 'TOOL', 'PART', 'BATCH'], {
    errorMap: () => ({ message: 'Tipo QR non riconosciuto' })
  }),
  timestamp: z.string()
    .datetime({ message: 'Timestamp non valido' })
    .refine(
      (date) => {
        const parsed = new Date(date);
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore
        return (now.getTime() - parsed.getTime()) <= maxAge;
      },
      { message: 'QR code scaduto (> 24 ore)' }
    ),
  version: z.string().optional().default('1.0'),
});

// Schema specifico per ODL
const ODLQRSchema = BaseQRSchema.extend({
  type: z.literal('ODL'),
  id: z.string()
    .min(1, 'ID ODL richiesto')
    .max(50, 'ID ODL troppo lungo')
    .regex(/^ODL\d{8}\d{4}$|^[A-Z0-9-_]{3,20}$/, 'Formato ID ODL non valido'),
  partNumber: z.string()
    .min(3, 'Part number troppo corto')
    .max(30, 'Part number troppo lungo')
    .regex(/^[A-Z0-9]+$/i, 'Part number deve essere alfanumerico'),
  batch: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

// Schema specifico per Department
const DepartmentQRSchema = BaseQRSchema.extend({
  type: z.literal('DEPARTMENT'),
  id: z.string().cuid('ID reparto non valido'),
  code: z.string()
    .min(2, 'Codice reparto troppo corto')
    .max(10, 'Codice reparto troppo lungo')
    .regex(/^[A-Z_]+$/, 'Codice reparto deve essere in maiuscolo'),
  name: z.string().min(1, 'Nome reparto richiesto'),
});

// Schema specifico per Tool
const ToolQRSchema = BaseQRSchema.extend({
  type: z.literal('TOOL'),
  id: z.string().cuid('ID utensile non valido'),
  toolPartNumber: z.string()
    .min(3, 'Part number utensile troppo corto')
    .max(30, 'Part number utensile troppo lungo')
    .regex(/^[A-Z0-9]+$/i, 'Part number utensile deve essere alfanumerico'),
  description: z.string().optional(),
});

// Schema specifico per Part
const PartQRSchema = BaseQRSchema.extend({
  type: z.literal('PART'),
  id: z.string().cuid('ID parte non valido'),
  partNumber: z.string()
    .min(3, 'Part number troppo corto')
    .max(30, 'Part number troppo lungo')
    .regex(/^[A-Z0-9]+$/i, 'Part number deve essere alfanumerico'),
  description: z.string().optional(),
});

// Schema specifico per Batch Autoclave
const BatchQRSchema = BaseQRSchema.extend({
  type: z.literal('BATCH'),
  id: z.string().cuid('ID batch non valido'),
  loadNumber: z.string()
    .min(1, 'Numero carico richiesto')
    .max(20, 'Numero carico troppo lungo'),
  autoclaveId: z.string().cuid('ID autoclave non valido'),
  curingCycleId: z.string().cuid('ID ciclo cura non valido'),
});

// Union type per tutti i tipi di QR supportati
export const QRDataSchema = z.discriminatedUnion('type', [
  ODLQRSchema,
  DepartmentQRSchema,
  ToolQRSchema,
  PartQRSchema,
  BatchQRSchema,
]);

// Tipi TypeScript derivati dagli schemi
export type QRData = z.infer<typeof QRDataSchema>;
export type ODLQRData = z.infer<typeof ODLQRSchema>;
export type DepartmentQRData = z.infer<typeof DepartmentQRSchema>;
export type ToolQRData = z.infer<typeof ToolQRSchema>;
export type PartQRData = z.infer<typeof PartQRSchema>;
export type BatchQRData = z.infer<typeof BatchQRSchema>;

/**
 * Validazione sicura e parsing di dati QR Code
 */
export class QRValidator {
  /**
   * Valida e parsa dati QR grezzi
   */
  static validateAndParse(rawData: string): {
    success: boolean;
    data?: QRData;
    error?: string;
    details?: z.ZodError;
  } {
    try {
      // Prima validazione: parsing JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawData);
      } catch (jsonError) {
        return {
          success: false,
          error: 'QR code non contiene JSON valido'
        };
      }

      // Seconda validazione: struttura dati
      if (!parsedJson || typeof parsedJson !== 'object') {
        return {
          success: false,
          error: 'QR code non contiene un oggetto valido'
        };
      }

      // Terza validazione: schema Zod
      const validationResult = QRDataSchema.safeParse(parsedJson);
      
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        
        return {
          success: false,
          error: `Dati QR non validi: ${errorMessages}`,
          details: validationResult.error
        };
      }

      return {
        success: true,
        data: validationResult.data
      };

    } catch (error) {
      return {
        success: false,
        error: 'Errore imprevisto durante validazione QR'
      };
    }
  }

  /**
   * Valida specificamente dati ODL QR
   */
  static validateODLQR(rawData: string): {
    success: boolean;
    data?: ODLQRData;
    error?: string;
  } {
    const result = this.validateAndParse(rawData);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.data?.type !== 'ODL') {
      return {
        success: false,
        error: 'QR code non è di tipo ODL'
      };
    }

    return {
      success: true,
      data: result.data as ODLQRData
    };
  }

  /**
   * Valida specificamente dati Department QR
   */
  static validateDepartmentQR(rawData: string): {
    success: boolean;
    data?: DepartmentQRData;
    error?: string;
  } {
    const result = this.validateAndParse(rawData);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.data?.type !== 'DEPARTMENT') {
      return {
        success: false,
        error: 'QR code non è di tipo DEPARTMENT'
      };
    }

    return {
      success: true,
      data: result.data as DepartmentQRData
    };
  }

  /**
   * Controlla se un QR è ancora valido (non scaduto)
   */
  static isQRValid(qrData: QRData): boolean {
    try {
      const timestamp = new Date(qrData.timestamp);
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 ore
      
      return (now.getTime() - timestamp.getTime()) <= maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Genera fingerprint unico per QR (per prevenire replay attacks)
   */
  static generateFingerprint(qrData: QRData): string {
    const payload = `${qrData.type}-${qrData.id || 'unknown'}-${qrData.timestamp}`;
    
    // Simple hash function per fingerprinting
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Sanitizza dati QR per logging sicuro
   */
  static sanitizeForLogging(qrData: QRData): Record<string, unknown> {
    return {
      type: qrData.type,
      id: qrData.id ? `${qrData.id.substring(0, 3)}***` : 'unknown',
      timestamp: qrData.timestamp,
      version: qrData.version,
      fingerprint: this.generateFingerprint(qrData)
    };
  }
}

/**
 * Generatori sicuri di QR data
 */
export class QRGenerator {
  /**
   * Genera dati QR per ODL
   */
  static generateODLQR(data: {
    id: string;
    partNumber: string;
    batch?: string;
    priority?: ODLQRData['priority'];
  }): ODLQRData {
    return {
      type: 'ODL',
      id: data.id,
      partNumber: data.partNumber,
      batch: data.batch,
      priority: data.priority,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Genera dati QR per Department
   */
  static generateDepartmentQR(data: {
    id: string;
    code: string;
    name: string;
  }): DepartmentQRData {
    return {
      type: 'DEPARTMENT',
      id: data.id,
      code: data.code,
      name: data.name,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Genera dati QR per Tool
   */
  static generateToolQR(data: {
    id: string;
    toolPartNumber: string;
    description?: string;
  }): ToolQRData {
    return {
      type: 'TOOL',
      id: data.id,
      toolPartNumber: data.toolPartNumber,
      description: data.description,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Genera dati QR per Part
   */
  static generatePartQR(data: {
    id: string;
    partNumber: string;
    description?: string;
  }): PartQRData {
    return {
      type: 'PART',
      id: data.id,
      partNumber: data.partNumber,
      description: data.description,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Genera dati QR per Batch Autoclave
   */
  static generateBatchQR(data: {
    id: string;
    loadNumber: string;
    autoclaveId: string;
    curingCycleId: string;
  }): BatchQRData {
    return {
      type: 'BATCH',
      id: data.id,
      loadNumber: data.loadNumber,
      autoclaveId: data.autoclaveId,
      curingCycleId: data.curingCycleId,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Converte QR data in stringa JSON sicura
   */
  static toQRString(qrData: QRData): string {
    return JSON.stringify(qrData);
  }
}

/**
 * Cache per prevenire scansioni duplicate
 */
export class QRScanCache {
  private static cache = new Map<string, { timestamp: number; count: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minuti
  private static readonly MAX_SCANS = 10; // Max scansioni per QR nell'intervallo

  /**
   * Controlla se QR è già stato scansionato di recente
   */
  static checkAndRecord(qrData: QRData): {
    allowed: boolean;
    reason?: string;
    remainingScans?: number;
  } {
    const fingerprint = QRValidator.generateFingerprint(qrData);
    const now = Date.now();
    
    // Pulizia cache entries scadute
    this.cleanupExpired(now);
    
    const existing = this.cache.get(fingerprint);
    
    if (!existing) {
      // Prima scansione
      this.cache.set(fingerprint, { timestamp: now, count: 1 });
      return { allowed: true, remainingScans: this.MAX_SCANS - 1 };
    }
    
    // Incrementa contatore
    existing.count += 1;
    existing.timestamp = now;
    
    if (existing.count > this.MAX_SCANS) {
      return {
        allowed: false,
        reason: 'QR scansionato troppo di frequente',
        remainingScans: 0
      };
    }
    
    return {
      allowed: true,
      remainingScans: this.MAX_SCANS - existing.count
    };
  }

  /**
   * Pulisce entries scadute dalla cache
   */
  private static cleanupExpired(now: number): void {
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Reset cache (per testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Statistiche cache
   */
  static getStats(): {
    size: number;
    entries: Array<{ fingerprint: string; count: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([fingerprint, entry]) => ({
      fingerprint,
      count: entry.count,
      age: now - entry.timestamp
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }
}