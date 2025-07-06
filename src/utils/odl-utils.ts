/**
 * Utilities per ODL e gestione dipartimenti correnti
 */

import { prisma } from '@/lib/prisma';

/**
 * Deriva il dipartimento corrente di un ODL dall'ultimo evento di tipo ENTRY
 * @param odlId ID dell'ODL
 * @returns ID del dipartimento corrente o null se non trovato
 */
export async function getCurrentDepartmentId(odlId: string): Promise<string | null> {
  try {
    // Trova l'ultimo evento di tipo ENTRY per questo ODL
    const lastEntryEvent = await prisma.productionEvent.findFirst({
      where: {
        odlId,
        eventType: 'ENTRY'
      },
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        departmentId: true
      }
    });

    return lastEntryEvent?.departmentId || null;
  } catch (error) {
    console.error('Error getting current department for ODL:', error);
    return null;
  }
}

/**
 * Deriva i dipartimenti correnti per più ODL in batch
 * @param odlIds Array di ID ODL
 * @returns Map di odlId -> departmentId
 */
export async function getCurrentDepartmentIds(odlIds: string[]): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  try {
    // Query più efficiente: prendi tutti gli eventi ENTRY per gli ODL richiesti
    const lastEntryEvents = await prisma.productionEvent.findMany({
      where: {
        odlId: { in: odlIds },
        eventType: 'ENTRY'
      },
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        odlId: true,
        departmentId: true,
        timestamp: true
      }
    });

    // Raggruppa per ODL e prendi il più recente
    const latestEvents = new Map<string, typeof lastEntryEvents[0]>();
    
    for (const event of lastEntryEvents) {
      const existing = latestEvents.get(event.odlId);
      if (!existing || event.timestamp > existing.timestamp) {
        latestEvents.set(event.odlId, event);
      }
    }

    // Popola il risultato
    for (const odlId of odlIds) {
      const latestEvent = latestEvents.get(odlId);
      result.set(odlId, latestEvent?.departmentId || null);
    }

    return result;
  } catch (error) {
    console.error('Error getting current departments for ODLs:', error);
    
    // Fallback: mappa vuota
    for (const odlId of odlIds) {
      result.set(odlId, null);
    }
    
    return result;
  }
}

/**
 * Query helper per includere currentDepartmentId virtuale in query ODL
 * Aggiunge il dipartimento corrente derivato dagli eventi
 */
export const ODL_WITH_CURRENT_DEPARTMENT = {
  include: {
    part: true,
    events: {
      where: { eventType: 'ENTRY' },
      orderBy: { timestamp: 'desc' },
      take: 1,
      select: {
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    }
  }
} as const;

/**
 * Trasforma un ODL con eventi in formato con currentDepartmentId
 */
export function transformODLWithCurrentDepartment(odl: any) {
  const currentDepartmentId = odl.events?.[0]?.departmentId || null;
  const currentDepartment = odl.events?.[0]?.department || null;
  
  return {
    ...odl,
    currentDepartmentId,
    currentDepartment,
    events: undefined // Rimuovi gli eventi utilizzati solo per derivare il dipartimento
  };
}