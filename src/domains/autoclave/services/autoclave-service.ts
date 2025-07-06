import { prisma } from '@/lib/prisma';
import { Prisma, LoadStatus } from '@prisma/client';

export class AutoclaveService {
  /**
   * Trova tutti gli autoclavi attivi
   */
  static async findAllActive() {
    return prisma.autoclave.findMany({
      where: { isActive: true },
      include: {
        department: true,
        loads: {
          where: {
            status: {
              in: [LoadStatus.READY, LoadStatus.IN_CURE]
            }
          },
          orderBy: { plannedStart: 'desc' },
          take: 5
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Trova autoclavi per IDs
   */
  static async findByIds(ids: string[]) {
    return prisma.autoclave.findMany({
      where: {
        id: { in: ids },
        isActive: true
      },
      include: {
        department: true
      }
    });
  }

  /**
   * Crea un nuovo batch (AutoclaveLoad)
   */
  static async createBatch(data: {
    autoclaveId: string;
    curingCycleId: string;
    plannedStart: Date;
    plannedEnd: Date;
    layoutData?: any;
    odlIds: string[];
  }) {
    // Genera numero batch progressivo
    const lastLoad = await prisma.autoclaveLoad.findFirst({
      orderBy: { loadNumber: 'desc' }
    });
    
    const nextNumber = lastLoad 
      ? parseInt(lastLoad.loadNumber.replace('BATCH-', '')) + 1
      : 1;
    
    const loadNumber = `BATCH-${nextNumber.toString().padStart(6, '0')}`;

    return prisma.autoclaveLoad.create({
      data: {
        loadNumber,
        autoclaveId: data.autoclaveId,
        curingCycleId: data.curingCycleId,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
        status: LoadStatus.DRAFT,
        layoutData: data.layoutData,
        loadItems: {
          createMany: {
            data: data.odlIds.map(odlId => ({
              odlId,
              position: undefined // Sarà popolato dal layoutData
            }))
          }
        }
      },
      include: {
        autoclave: true,
        curingCycle: true,
        loadItems: {
          include: {
            odl: {
              include: {
                part: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Aggiorna stato batch
   */
  static async updateBatchStatus(
    loadId: string,
    status: LoadStatus,
    actualStart?: Date,
    actualEnd?: Date
  ) {
    return prisma.autoclaveLoad.update({
      where: { id: loadId },
      data: {
        status,
        ...(actualStart && { actualStart }),
        ...(actualEnd && { actualEnd })
      }
    });
  }

  /**
   * Trova batch per autoclave e stato
   */
  static async findBatchesByStatus(autoclaveId?: string, status?: LoadStatus) {
    return prisma.autoclaveLoad.findMany({
      where: {
        ...(autoclaveId && { autoclaveId }),
        ...(status && { status })
      },
      include: {
        autoclave: true,
        curingCycle: true,
        loadItems: {
          include: {
            odl: {
              include: {
                part: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Ottieni statistiche autoclavi
   */
  static async getStatistics(departmentId?: string) {
    const autoclaves = await prisma.autoclave.findMany({
      where: {
        isActive: true,
        ...(departmentId && { departmentId })
      },
      include: {
        loads: {
          where: {
            status: {
              in: [LoadStatus.COMPLETED, LoadStatus.RELEASED]
            },
            actualEnd: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Ultimi 30 giorni
            }
          }
        }
      }
    });

    return autoclaves.map(autoclave => ({
      autoclave,
      statistics: {
        totalLoads: autoclave.loads.length,
        averageUtilization: this._calculateAverageUtilization(autoclave.loads),
        totalCycleTime: autoclave.loads.reduce((sum, load) => {
          if (load.actualStart && load.actualEnd) {
            return sum + (load.actualEnd.getTime() - load.actualStart.getTime());
          }
          return sum;
        }, 0)
      }
    }));
  }

  private static _calculateAverageUtilization(loads: any[]): number {
    if (loads.length === 0) return 0;
    
    const utilizationRates = loads
      .map(load => {
        if (load.layoutData?.efficiency) {
          return load.layoutData.efficiency;
        }
        return 0;
      })
      .filter(rate => rate > 0);
    
    if (utilizationRates.length === 0) return 0;
    
    return utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
  }
}