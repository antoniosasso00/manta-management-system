import { prisma } from '@/lib/prisma';
import { LoadStatus, ODLStatus } from '@prisma/client';

export interface BatchCreateData {
  autoclaveId: string;
  curingCycleId: string;
  plannedStart: Date;
  plannedEnd: Date;
  odlIds: string[];
}

export interface BatchSummary {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  autoclaveName: string;
  curingCycleName: string;
  odlCount: number;
  totalQuantity: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  estimatedVolume: number;
  utilizationPercentage: number;
}

export interface BatchDetails extends BatchSummary {
  odls: Array<{
    id: string;
    odlNumber: string;
    partNumber: string;
    partDescription: string;
    quantity: number;
    priority: string;
    status: ODLStatus;
    previousStatus?: ODLStatus;
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
    };
  }>;
  autoclave: {
    id: string;
    code: string;
    name: string;
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
    vacuumLines: number;
  };
  curingCycle: {
    id: string;
    name: string;
    description?: string;
    totalDuration: number;
  };
}

export class AutoclaviBatchService {
  /**
   * Recupera tutti i batch con filtri opzionali
   */
  static async getAllBatches(filters?: {
    status?: LoadStatus;
    autoclaveId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<BatchSummary[]> {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.autoclaveId) where.autoclaveId = filters.autoclaveId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.plannedStart = {};
      if (filters.dateFrom) where.plannedStart.gte = filters.dateFrom;
      if (filters.dateTo) where.plannedStart.lte = filters.dateTo;
    }

    const batches = await prisma.autoclaveLoad.findMany({
      where,
      include: {
        autoclave: true,
        curingCycle: true,
        loadItems: {
          include: {
            odl: {
              include: {
                part: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { plannedStart: 'asc' },
      ],
    });

    return batches.map(batch => this.mapBatchToSummary(batch));
  }

  /**
   * Recupera dettagli completi di un batch
   */
  static async getBatchDetails(batchId: string): Promise<BatchDetails | null> {
    const batch = await prisma.autoclaveLoad.findUnique({
      where: { id: batchId },
      include: {
        autoclave: true,
        curingCycle: true,
        loadItems: {
          include: {
            odl: {
              include: {
                part: true,
              },
            },
          },
        },
      },
    });

    if (!batch) return null;

    return this.mapBatchToDetails(batch);
  }

  /**
   * Crea nuovo batch con validazioni
   */
  static async createBatch(data: BatchCreateData, userId: string): Promise<BatchDetails> {
    // Validazioni preliminari
    await this.validateBatchCreation(data);

    // Genera numero batch
    const batchCount = await prisma.autoclaveLoad.count();
    const loadNumber = `B-${new Date().getFullYear()}-${String(batchCount + 1).padStart(3, '0')}`;

    const batch = await prisma.$transaction(async (tx) => {
      // Crea batch
      const newBatch = await tx.autoclaveLoad.create({
        data: {
          loadNumber,
          autoclaveId: data.autoclaveId,
          curingCycleId: data.curingCycleId,
          plannedStart: data.plannedStart,
          plannedEnd: data.plannedEnd,
          status: 'DRAFT',
        },
      });

      // Recupera ODL con dettagli
      const odls = await tx.oDL.findMany({
        where: { id: { in: data.odlIds } },
        include: { part: true },
      });

      // Aggiungi ODL al batch
      await Promise.all(
        odls.map(async (odl) => {
          await tx.autoclaveLoadItem.create({
            data: {
              odlId: odl.id,
              autoclaveLoadId: newBatch.id,
              previousStatus: odl.status,
            },
          });

          await tx.oDL.update({
            where: { id: odl.id },
            data: { status: 'IN_AUTOCLAVE' },
          });
        })
      );

      // Log evento
      await tx.productionEvent.create({
        data: {
          odlId: odls[0].id,
          departmentId: 'autoclave-dept',
          eventType: 'ENTRY',
          notes: `Batch created: ${loadNumber} with ${odls.length} ODLs in autoclave ${data.autoclaveId}`,
          userId: 'system',
        },
      });

      return newBatch.id;
    });

    // Recupera batch completo per ritorno
    const fullBatch = await this.getBatchDetails(batch);
    if (!fullBatch) throw new Error('Errore recupero batch creato');

    return fullBatch;
  }

  /**
   * Aggiorna stato batch con logica specifica
   */
  static async advanceBatchStatus(
    batchId: string,
    targetStatus: LoadStatus,
    userId: string,
    scannedOdlId?: string
  ): Promise<{ batch: BatchDetails; message: string; odlUpdates: string[] }> {
    const batch = await this.getBatchDetails(batchId);
    if (!batch) throw new Error('Batch non trovato');

    // Validazione transizione
    this.validateStatusTransition(batch.status, targetStatus);

    // Se ODL scansionato, verifica appartenenza al batch
    if (scannedOdlId) {
      const odlInBatch = batch.odls.find(odl => odl.id === scannedOdlId);
      if (!odlInBatch) {
        throw new Error('ODL scansionato non appartiene al batch');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let message = '';
      const odlUpdates: string[] = [];

      // Aggiorna batch
      const updateData: any = { status: targetStatus };
      
      switch (targetStatus) {
        case 'READY':
          if (!batch.actualStart) updateData.actualStart = new Date();
          message = 'Batch pronto per avvio cura';
          break;

        case 'IN_CURE':
          updateData.actualStart = batch.actualStart || new Date();
          message = 'Ciclo di cura avviato';
          break;

        case 'COMPLETED':
          updateData.actualEnd = new Date();
          
          // Avanza tutti gli ODL
          for (const odl of batch.odls) {
            await tx.oDL.update({
              where: { id: odl.id },
              data: { status: 'AUTOCLAVE_COMPLETED' },
            });
            odlUpdates.push(odl.odlNumber);
          }
          
          message = `Cura completata - ${batch.odls.length} ODL avanzati`;
          break;

        case 'RELEASED':
          // Trasferisci al reparto successivo
          for (const odl of batch.odls) {
            await tx.oDL.update({
              where: { id: odl.id },
              data: { status: 'IN_NDI' },
            });
            odlUpdates.push(odl.odlNumber);
          }
          
          message = `Batch rilasciato - ${batch.odls.length} ODL trasferiti al reparto NDI`;
          break;
      }

      await tx.autoclaveLoad.update({
        where: { id: batchId },
        data: updateData,
      });

      // Log evento
      await tx.productionEvent.create({
        data: {
          odlId: batch.odls[0]?.id || '',
          departmentId: 'autoclave-dept',
          eventType: 'NOTE',
          notes: `Batch status changed: ${batch.loadNumber} from ${batch.status} to ${status}`,
          userId: 'system',
        },
      });

      return { message, odlUpdates };
    });

    const updatedBatch = await this.getBatchDetails(batchId);
    if (!updatedBatch) throw new Error('Errore recupero batch aggiornato');

    return {
      batch: updatedBatch,
      message: result.message,
      odlUpdates: result.odlUpdates,
    };
  }

  /**
   * Rimuovi ODL dal batch con ripristino stato
   */
  static async removeOdlFromBatch(batchId: string, odlId: string): Promise<void> {
    const loadItem = await prisma.autoclaveLoadItem.findUnique({
      where: {
        odlId_autoclaveLoadId: {
          odlId,
          autoclaveLoadId: batchId,
        },
      },
    });

    if (!loadItem) throw new Error('ODL non trovato nel batch');

    await prisma.$transaction(async (tx) => {
      // Ripristina stato ODL
      await tx.oDL.update({
        where: { id: odlId },
        data: { status: loadItem.previousStatus || 'CLEANROOM_COMPLETED' },
      });

      // Rimuovi dal batch
      await tx.autoclaveLoadItem.delete({
        where: {
          odlId_autoclaveLoadId: {
            odlId,
            autoclaveLoadId: batchId,
          },
        },
      });
    });
  }

  /**
   * Trova batch contenente un ODL specifico
   */
  static async findBatchByOdl(odlId: string): Promise<BatchDetails | null> {
    const loadItem = await prisma.autoclaveLoadItem.findFirst({
      where: { odlId },
      include: {
        autoclaveLoad: {
          include: {
            autoclave: true,
            curingCycle: true,
            loadItems: {
              include: {
                odl: {
                  include: {
                    part: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!loadItem) return null;

    return this.mapBatchToDetails(loadItem.autoclaveLoad);
  }

  // Metodi di utilità privati
  private static async validateBatchCreation(data: BatchCreateData): Promise<void> {
    // Verifica autoclave
    const autoclave = await prisma.autoclave.findUnique({
      where: { id: data.autoclaveId },
    });
    if (!autoclave) throw new Error('Autoclave non trovata');

    // Verifica ciclo di cura
    const cycle = await prisma.curingCycle.findUnique({
      where: { id: data.curingCycleId },
    });
    if (!cycle) throw new Error('Ciclo di cura non trovato');

    // Verifica ODL disponibili
    const odls = await prisma.oDL.findMany({
      where: {
        id: { in: data.odlIds },
        status: 'CLEANROOM_COMPLETED',
      },
      include: { part: true },
    });

    if (odls.length !== data.odlIds.length) {
      throw new Error('Alcuni ODL non sono disponibili');
    }

    // Verifica compatibilità cicli
    const incompatible = odls.filter(odl => {
      const odlCycleId = odl.part.defaultCuringCycleId;
      return odlCycleId !== data.curingCycleId;
    });

    if (incompatible.length > 0) {
      throw new Error(`ODL con cicli incompatibili: ${incompatible.map(odl => odl.odlNumber).join(', ')}`);
    }
  }

  private static validateStatusTransition(currentStatus: LoadStatus, targetStatus: LoadStatus): void {
    const validTransitions: Record<LoadStatus, LoadStatus[]> = {
      'DRAFT': ['READY', 'CANCELLED'],
      'READY': ['IN_CURE', 'DRAFT', 'CANCELLED'],
      'IN_CURE': ['COMPLETED', 'READY', 'CANCELLED'],
      'COMPLETED': ['RELEASED', 'IN_CURE'],
      'RELEASED': [],
      'CANCELLED': ['DRAFT'],
    };

    if (!validTransitions[currentStatus]?.includes(targetStatus)) {
      throw new Error(`Transizione non valida da ${currentStatus} a ${targetStatus}`);
    }
  }

  private static mapBatchToSummary(batch: any): BatchSummary {
    const totalVolume = batch.loadItems.reduce((sum: number, item: any) => {
      const length = item.odl.length || item.odl.part.standardLength || 0;
      const width = item.odl.width || item.odl.part.standardWidth || 0;
      const height = item.odl.height || item.odl.part.standardHeight || 0;
      return sum + (length * width * height * item.odl.quantity);
    }, 0);

    const autoclaveVolume = batch.autoclave?.maxLength * batch.autoclave?.maxWidth * batch.autoclave?.maxHeight || 0;
    const utilization = autoclaveVolume > 0 ? (totalVolume / autoclaveVolume) * 100 : 0;

    return {
      id: batch.id,
      loadNumber: batch.loadNumber,
      status: batch.status,
      autoclaveName: batch.autoclave?.name || 'Unknown',
      curingCycleName: batch.curingCycle?.name || 'Unknown',
      odlCount: batch.loadItems.length,
      totalQuantity: batch.loadItems.reduce((sum: number, item: any) => sum + item.odl.quantity, 0),
      plannedStart: batch.plannedStart,
      plannedEnd: batch.plannedEnd,
      actualStart: batch.actualStart,
      actualEnd: batch.actualEnd,
      estimatedVolume: totalVolume,
      utilizationPercentage: Math.round(utilization),
    };
  }

  private static mapBatchToDetails(batch: any): BatchDetails {
    const summary = this.mapBatchToSummary(batch);

    return {
      ...summary,
      odls: batch.loadItems.map((item: any) => ({
        id: item.odl.id,
        odlNumber: item.odl.odlNumber,
        partNumber: item.odl.part.partNumber,
        partDescription: item.odl.part.description,
        quantity: item.odl.quantity,
        priority: item.odl.priority,
        status: item.odl.status,
        previousStatus: item.previousStatus,
        dimensions: {
          length: item.odl.length || item.odl.part.standardLength,
          width: item.odl.width || item.odl.part.standardWidth,
          height: item.odl.height || item.odl.part.standardHeight,
        },
      })),
      autoclave: batch.autoclave ? {
        id: batch.autoclave.id,
        code: batch.autoclave.code,
        name: batch.autoclave.name,
        maxLength: batch.autoclave.maxLength,
        maxWidth: batch.autoclave.maxWidth,
        maxHeight: batch.autoclave.maxHeight,
        vacuumLines: batch.autoclave.vacuumLines,
      } : {
        id: '',
        code: '',
        name: 'Unknown',
        maxLength: 0,
        maxWidth: 0,
        maxHeight: 0,
        vacuumLines: 0,
      },
      curingCycle: batch.curingCycle ? {
        id: batch.curingCycle.id,
        name: batch.curingCycle.name,
        description: batch.curingCycle.description,
        totalDuration: batch.curingCycle.totalDuration,
      } : {
        id: '',
        name: 'Unknown',
        description: '',
        totalDuration: 0,
      },
    };
  }
}