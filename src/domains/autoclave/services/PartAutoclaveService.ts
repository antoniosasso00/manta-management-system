import { prisma } from '@/lib/prisma';
import { PartAutoclave, Prisma } from '@prisma/client';

export class PartAutoclaveService {
  /**
   * Trova tutte le configurazioni part-autoclave
   */
  static async findAll(filters?: {
    partNumber?: string;
    curingCycleId?: string;
  }) {
    const where: Prisma.PartAutoclaveWhereInput = {};
    
    if (filters?.partNumber) {
      where.part = {
        partNumber: {
          contains: filters.partNumber,
          mode: 'insensitive'
        }
      };
    }
    
    if (filters?.curingCycleId) {
      where.curingCycleId = filters.curingCycleId;
    }

    return prisma.partAutoclave.findMany({
      where,
      include: {
        part: true,
        curingCycle: true
      },
      orderBy: [
        { part: { partNumber: 'asc' } }
      ]
    });
  }

  /**
   * Trova configurazione per part ID
   */
  static async findByPartId(partId: string) {
    return prisma.partAutoclave.findUnique({
      where: { partId },
      include: {
        part: true,
        curingCycle: true
      }
    });
  }

  /**
   * Crea o aggiorna configurazione
   */
  static async upsert(data: {
    partId: string;
    curingCycleId: string;
    vacuumLines: number;
    setupTime?: number;
    loadPosition?: string;
    notes?: string;
  }) {
    return prisma.partAutoclave.upsert({
      where: { partId: data.partId },
      create: data,
      update: {
        curingCycleId: data.curingCycleId,
        vacuumLines: data.vacuumLines,
        setupTime: data.setupTime,
        loadPosition: data.loadPosition,
        notes: data.notes
      },
      include: {
        part: true,
        curingCycle: true
      }
    });
  }

  /**
   * Elimina configurazione
   */
  static async delete(id: string) {
    return prisma.partAutoclave.delete({
      where: { id }
    });
  }

  /**
   * Import bulk da CSV/Excel
   */
  static async bulkImport(data: Array<{
    partNumber: string;
    curingCycleCode: string;
    vacuumLines: number;
    setupTime?: number;
    loadPosition?: string;
    notes?: string;
  }>) {
    const results = {
      success: 0,
      errors: [] as string[]
    };

    for (const item of data) {
      try {
        // Trova part e ciclo
        const [part, curingCycle] = await Promise.all([
          prisma.part.findUnique({ where: { partNumber: item.partNumber } }),
          prisma.curingCycle.findUnique({ where: { code: item.curingCycleCode } })
        ]);

        if (!part) {
          results.errors.push(`Part ${item.partNumber} non trovato`);
          continue;
        }

        if (!curingCycle) {
          results.errors.push(`Ciclo ${item.curingCycleCode} non trovato`);
          continue;
        }

        await this.upsert({
          partId: part.id,
          curingCycleId: curingCycle.id,
          vacuumLines: item.vacuumLines,
          setupTime: item.setupTime,
          loadPosition: item.loadPosition,
          notes: item.notes
        });

        results.success++;
      } catch (error) {
        results.errors.push(`Errore per ${item.partNumber}: ${error}`);
      }
    }

    return results;
  }
}