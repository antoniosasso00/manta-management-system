import { prisma } from '@/lib/prisma';

/**
 * Servizio per integrare i dati con il microservizio di ottimizzazione
 */
export class OptimizationIntegrationService {
  
  /**
   * Prepara i dati per il microservizio di ottimizzazione
   * Il microservizio si aspetta dati nel formato specifico per il bin packing 2D
   */
  static async prepareOptimizationData(odlIds: string[]) {
    // Recupera tutti gli ODL con i dati necessari
    const odls = await prisma.oDL.findMany({
      where: {
        id: { in: odlIds }
      },
      include: {
        part: {
          include: {
            autoclaveConfig: {
              include: {
                curingCycle: true
              }
            },
            partTools: {
              include: {
                tool: true
              }
            }
          }
        }
      }
    });

    // Verifica che tutti gli ODL abbiano configurazione autoclave
    const missingConfigs = odls.filter(odl => !odl.part.autoclaveConfig);
    if (missingConfigs.length > 0) {
      throw new Error(`Part senza configurazione autoclave: ${missingConfigs.map(o => o.part.partNumber).join(', ')}`);
    }

    // Prepara i dati nel formato richiesto dal microservizio
    const items = odls.map(odl => {
      const config = odl.part.autoclaveConfig!;
      const tools = odl.part.partTools;

      return {
        odl_id: odl.id,
        odl_number: odl.odlNumber,
        part_number: odl.part.partNumber,
        quantity: odl.quantity,
        
        // Dimensioni (usa le dimensioni del tooling principale)
        length: tools[0]?.tool.base || 0,
        width: tools[0]?.tool.height || 0,
        height: 0.1, // Default minimo
        
        // Parametri ciclo di cura
        curing_cycle_id: config.curingCycleId,
        curing_cycle_code: config.curingCycle.code,
        temperature: config.curingCycle.phase1Temperature,
        pressure: config.curingCycle.phase1Pressure,
        duration: config.curingCycle.phase1Duration + (config.curingCycle.phase2Duration || 0),
        
        // Vincoli autoclave
        vacuum_lines_required: config.vacuumLines,
        position_preference: config.loadPosition || null,
        
        // Tooling
        tooling_ids: tools.map(t => t.tool.toolPartNumber),
        tooling_dimensions: tools.map(t => ({
          id: t.tool.toolPartNumber,
          base: t.tool.base,
          height: t.tool.height,
          valves: t.tool.valveCount
        })),
        
        // Priorità
        priority: odl.priority,
        
        // Metadati aggiuntivi
        setup_time: config.setupTime || 0,
        notes: config.notes || null
      };
    });

    // Recupera autoclavi disponibili
    const autoclaves = await prisma.autoclave.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    return {
      items,
      autoclaves: autoclaves.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        max_length: a.maxLength,
        max_width: a.maxWidth,
        max_height: a.maxHeight,
        vacuum_lines: a.vacuumLines
      })),
      optimization_params: {
        algorithm: 'bottom_left',
        rotation_allowed: true,
        priority_weight: 0.3,
        utilization_weight: 0.7,
        max_iterations: 1000
      }
    };
  }

  /**
   * Valida che tutti i part abbiano le configurazioni necessarie
   */
  static async validatePartsForOptimization(partIds: string[]) {
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
      include: {
        autoclaveConfig: true,
        partTools: true
      }
    });

    const errors: string[] = [];

    for (const part of parts) {
      if (!part.autoclaveConfig) {
        errors.push(`${part.partNumber}: manca configurazione autoclave`);
      }
      if (part.partTools.length === 0) {
        errors.push(`${part.partNumber}: nessun tooling associato`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte il risultato dell'ottimizzazione in batch autoclave
   */
  static async createBatchesFromOptimization(optimizationResult: any) {
    const batches = [];

    for (const solution of optimizationResult.solutions) {
      const batch = await prisma.autoclaveLoad.create({
        data: {
          loadNumber: `BATCH-OPT-${Date.now()}`,
          autoclaveId: solution.autoclave_id,
          curingCycleId: solution.curing_cycle_id,
          plannedStart: new Date(solution.planned_start),
          plannedEnd: new Date(solution.planned_end),
          status: 'DRAFT',
          layoutData: {
            optimization_id: optimizationResult.optimization_id,
            algorithm: optimizationResult.algorithm,
            efficiency: solution.efficiency,
            vacuum_usage: solution.vacuum_usage,
            layout: solution.layout
          },
          loadItems: {
            createMany: {
              data: solution.items.map((item: any) => ({
                odlId: item.odl_id,
                position: {
                  x: item.position.x,
                  y: item.position.y,
                  rotation: item.rotation || 0
                }
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

      batches.push(batch);
    }

    return batches;
  }
}