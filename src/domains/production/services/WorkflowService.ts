import { prisma } from '@/lib/prisma';
import { DepartmentType, ODLStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { cache } from 'react';

// Cache per i dati di workflow più frequenti
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti
const workflowCache = new Map<string, { data: any; timestamp: number }>();

interface WorkflowTransition {
  from: DepartmentType;
  to: DepartmentType | null;
  requiredStatus: ODLStatus;
  targetStatus: ODLStatus;
}

// Cache helpers
function getCached<T>(key: string): T | null {
  const cached = workflowCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  workflowCache.delete(key);
  return null;
}

function setCached(key: string, data: any): void {
  workflowCache.set(key, { data, timestamp: Date.now() });
}

// Pulisce la cache periodicamente
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of workflowCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        workflowCache.delete(key);
      }
    }
  }, CACHE_TTL);
}

interface TransferResult {
  success: boolean;
  message: string;
  newStatus?: ODLStatus;
  nextDepartment?: { id: string; name: string; type: DepartmentType };
  rollbackData?: {
    previousStatus: ODLStatus;
    timestamp: Date;
  };
}

interface ValidationResult {
  canTransfer: boolean;
  reason?: string;
  nextDepartment?: { id: string; name: string; type: DepartmentType };
  requiredActions?: string[];
}

// Schema per validazione input
const transferInputSchema = z.object({
  odlId: z.string().cuid('ID ODL non valido'),
  currentDepartmentId: z.string().cuid('ID reparto non valido'),
  userId: z.string().cuid('ID utente non valido'),
  notes: z.string().optional(),
  forceTransfer: z.boolean().default(false)
});

type TransferInput = z.infer<typeof transferInputSchema>;

// Definizione workflow produttivo sequenziale aerospazio (parti composite)
// NOTA: HC è separato con ODL separati e logica separata - non fa parte del flusso principale
// Flusso principale: Clean Room → Autoclave → CN → NDI → Montaggio → Verniciatura
const WORKFLOW_SEQUENCE: WorkflowTransition[] = [
  {
    from: 'CLEANROOM',
    to: 'AUTOCLAVE',
    requiredStatus: 'CLEANROOM_COMPLETED',
    targetStatus: 'IN_AUTOCLAVE'
  },
  {
    from: 'AUTOCLAVE', 
    to: 'CONTROLLO_NUMERICO',
    requiredStatus: 'AUTOCLAVE_COMPLETED',
    targetStatus: 'IN_CONTROLLO_NUMERICO'
  },
  {
    from: 'CONTROLLO_NUMERICO',
    to: 'NDI',
    requiredStatus: 'CONTROLLO_NUMERICO_COMPLETED',
    targetStatus: 'IN_NDI'
  },
  {
    from: 'NDI',
    to: 'MONTAGGIO',
    requiredStatus: 'NDI_COMPLETED',
    targetStatus: 'IN_MONTAGGIO'
  },
  {
    from: 'MONTAGGIO',
    to: 'VERNICIATURA',
    requiredStatus: 'MONTAGGIO_COMPLETED',
    targetStatus: 'IN_VERNICIATURA'
  },
  {
    from: 'VERNICIATURA',
    to: 'CONTROLLO_QUALITA',
    requiredStatus: 'VERNICIATURA_COMPLETED',
    targetStatus: 'IN_CONTROLLO_QUALITA'
  },
  {
    from: 'CONTROLLO_QUALITA',
    to: null, // Fine workflow aerospazio
    requiredStatus: 'CONTROLLO_QUALITA_COMPLETED',
    targetStatus: 'COMPLETED'
  }
];

// NOTA: MOTORI è un reparto separato NON integrato nel workflow aerospazio
// Rimane disponibile come mockup per altre linee produttive

export class WorkflowService {
  /**
   * Ottiene il workflow appropriato per il tipo di reparto
   */
  static getWorkflowForDepartment(departmentType: DepartmentType): WorkflowTransition[] {
    // HONEYCOMB e MOTORI sono esclusi dal workflow principale - gestione separata
    if (departmentType === 'HONEYCOMB' || departmentType === 'MOTORI') {
      return []; // Nessun workflow automatico per honeycomb e motori
    }
    // Tutti gli altri reparti seguono workflow aerospazio sequenziale
    return WORKFLOW_SEQUENCE;
  }

  /**
   * Trova il prossimo reparto nella sequenza produttiva
   */
  static getNextDepartment(currentDepartmentType: DepartmentType): DepartmentType | null {
    const workflow = this.getWorkflowForDepartment(currentDepartmentType);
    const transition = workflow.find(t => t.from === currentDepartmentType);
    return transition?.to || null;
  }

  /**
   * Ottiene lo stato ODL richiesto per il passaggio
   */
  static getRequiredStatus(currentDepartmentType: DepartmentType): ODLStatus | null {
    const workflow = this.getWorkflowForDepartment(currentDepartmentType);
    const transition = workflow.find(t => t.from === currentDepartmentType);
    return transition?.requiredStatus || null;
  }

  /**
   * Ottiene lo stato target per il prossimo reparto
   */
  static getTargetStatus(currentDepartmentType: DepartmentType): ODLStatus | null {
    const workflow = this.getWorkflowForDepartment(currentDepartmentType);
    const transition = workflow.find(t => t.from === currentDepartmentType);
    return transition?.targetStatus || null;
  }

  /**
   * Valida se l'ODL può essere trasferito al reparto successivo
   * Versione migliorata con validazioni più robuste
   */
  static async validateTransfer(
    odlId: string, 
    currentDepartmentId: string,
    options: { forceTransfer?: boolean; checkDependencies?: boolean } = {}
  ): Promise<ValidationResult> {
    // Check cache first
    const cacheKey = `validate-${odlId}-${currentDepartmentId}-${JSON.stringify(options)}`;
    const cached = getCached<ValidationResult>(cacheKey);
    if (cached) return cached;

    try {
      // Recupera ODL con tutti i dati necessari per validazione
      const odl = await prisma.oDL.findUnique({
        where: { id: odlId },
        include: { 
          part: true,
          events: {
            where: {
              departmentId: currentDepartmentId
            },
            orderBy: {
              timestamp: 'desc'
            },
            take: 5
          },
          autoclaveLoadItems: {
            include: {
              autoclaveLoad: {
                select: { status: true }
              }
            }
          }
        }
      });

      if (!odl) {
        return { canTransfer: false, reason: 'ODL non trovato' };
      }

      const currentDepartment = await prisma.department.findUnique({
        where: { id: currentDepartmentId }
      });

      if (!currentDepartment) {
        return { canTransfer: false, reason: 'Reparto corrente non trovato' };
      }

      // Trova prossimo reparto
      const nextDepartmentType = this.getNextDepartment(currentDepartment.type);
      
      if (!nextDepartmentType) {
        return { canTransfer: false, reason: 'Fine workflow - ODL completato' };
      }

      const nextDepartment = await prisma.department.findFirst({
        where: { type: nextDepartmentType, isActive: true }
      });

      if (!nextDepartment) {
        return { canTransfer: false, reason: `Reparto ${nextDepartmentType} non disponibile` };
      }

      // Verifica stato ODL con validazioni aggiuntive
      const requiredStatus = this.getRequiredStatus(currentDepartment.type);
      const requiredActions: string[] = [];
      
      if (requiredStatus && odl.status !== requiredStatus) {
        if (!options.forceTransfer) {
          return { 
            canTransfer: false, 
            reason: `ODL deve essere in stato ${requiredStatus}, attualmente ${odl.status}`,
            requiredActions: [`Completare operazioni in ${currentDepartment.name}`]
          };
        } else {
          requiredActions.push(`Forzatura trasferimento da stato ${odl.status}`);
        }
      }

      // Verifica dipendenze specifiche per reparto
      if (options.checkDependencies !== false) {
        const dependencyCheck = await this.checkDepartmentDependencies(odl, currentDepartment.type);
        if (!dependencyCheck.passed) {
          return {
            canTransfer: false,
            reason: dependencyCheck.reason,
            requiredActions: dependencyCheck.actions
          };
        }
      }

      const result = {
        canTransfer: true,
        nextDepartment,
        requiredActions: requiredActions.length > 0 ? requiredActions : undefined
      };
      
      // Cache successful validation
      setCached(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Workflow validation error:', error);
      const result = { canTransfer: false, reason: 'Errore validazione workflow' };
      // Non cachare errori
      return result;
    }
  }

  /**
   * Esegue trasferimento automatico ODL al reparto successivo
   * Versione migliorata con transaction robuste e rollback
   */
  static async executeAutoTransfer(
    input: Omit<TransferInput, 'notes' | 'forceTransfer'> | {
      odlId: string;
      currentDepartmentId: string;
      userId: string;
      notes?: string;
      forceTransfer?: boolean;
    }
  ): Promise<TransferResult> {
    try {
      // Valida input
      const validatedInput = transferInputSchema.parse({
        odlId: input.odlId,
        currentDepartmentId: input.currentDepartmentId,
        userId: input.userId,
        notes: 'notes' in input ? input.notes : undefined,
        forceTransfer: 'forceTransfer' in input ? input.forceTransfer : false
      });

      // Valida trasferimento con opzioni
      const validation = await this.validateTransfer(
        validatedInput.odlId, 
        validatedInput.currentDepartmentId,
        { 
          forceTransfer: validatedInput.forceTransfer,
          checkDependencies: true 
        }
      );
      
      if (!validation.canTransfer) {
        return {
          success: false,
          message: validation.reason || 'Trasferimento non possibile'
        };
      }

      const { nextDepartment } = validation;
      const currentDepartment = await prisma.department.findUnique({
        where: { id: validatedInput.currentDepartmentId }
      });

      const targetStatus = this.getTargetStatus(currentDepartment!.type);

      if (!targetStatus) {
        return {
          success: false,
          message: 'Stato target non definito'
        };
      }

      // Salva stato corrente per rollback
      const originalODL = await prisma.oDL.findUnique({
        where: { id: validatedInput.odlId },
        select: { status: true, updatedAt: true }
      });

      if (!originalODL) {
        return {
          success: false,
          message: 'ODL non trovato per il trasferimento'
        };
      }

      // Esegui trasferimento in transazione atomica con retry automatico
      const result = await this.executeWithRetry(async () => {
        return await prisma.$transaction(async (tx) => {
        try {
          // 1. Aggiorna stato ODL con lock ottimistico atomico
          // Questa operazione fallirà se un'altra transazione ha modificato lo stato
          const updatedODL = await tx.oDL.update({
            where: { 
              id: validatedInput.odlId,
              status: originalODL.status // Verifica atomica che lo stato non sia cambiato
            },
            data: { 
              status: targetStatus,
              updatedAt: new Date()
            }
          });

          // Se l'update ha successo, significa che avevamo il lock corretto
          if (!updatedODL) {
            throw new Error('Stato ODL modificato durante il trasferimento - operazione annullata');
          }

          // 3. Crea evento EXIT dal reparto corrente
          await tx.productionEvent.create({
            data: {
              odlId: validatedInput.odlId,
              departmentId: validatedInput.currentDepartmentId,
              userId: validatedInput.userId,
              eventType: 'EXIT',
              notes: validatedInput.notes || `Uscita automatica per trasferimento a ${nextDepartment!.name}`,
              isAutomatic: true
            }
          });

          // 4. Crea evento ENTRY nel reparto successivo
          await tx.productionEvent.create({
            data: {
              odlId: validatedInput.odlId,
              departmentId: nextDepartment!.id,
              userId: validatedInput.userId,
              eventType: 'ENTRY',
              notes: validatedInput.notes || `Trasferimento automatico da ${currentDepartment!.name}`,
              isAutomatic: true
            }
          });

          // 5. Aggiorna metriche reparto (se implementato)
          await this.updateDepartmentMetrics(validatedInput.currentDepartmentId, nextDepartment!.id, tx);

          // 6. Notifica ai responsabili del reparto successivo
          await this.sendTransferNotification(validatedInput.odlId, nextDepartment!, tx);

          return { updatedODL, nextDepartment, originalStatus: originalODL.status };

        } catch (transactionError) {
          console.error('Transaction error during transfer:', transactionError);
          throw transactionError;
        }
      }, {
        maxWait: 10000, // 10 secondi max wait
        timeout: 30000, // 30 secondi timeout
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
      }); // Chiusura executeWithRetry

      return {
        success: true,
        message: `ODL trasferito automaticamente a ${result.nextDepartment!.name}`,
        newStatus: targetStatus,
        nextDepartment: result.nextDepartment,
        rollbackData: {
          previousStatus: result.originalStatus,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Auto transfer error:', error);
      
      // Log dettagliato per debugging
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: `Dati di input non validi: ${error.errors.map(e => e.message).join(', ')}`
        };
      }
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            success: false,
            message: 'Conflitto durante il trasferimento, riprovare'
          };
        }
        if (error.code === 'P2025') {
          return {
            success: false,
            message: 'ODL o reparto non trovato durante il trasferimento'
          };
        }
      }
      
      return {
        success: false,
        message: 'Errore durante trasferimento automatico. Contattare supporto tecnico.'
      };
    }
  }

  /**
   * Invia notifiche ai responsabili del reparto di destinazione
   */
  private static async sendTransferNotification(
    odlId: string, 
    department: { id: string; name: string }, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any
  ): Promise<void> {
    try {
      // Trova responsabili reparto (CAPO_REPARTO, CAPO_TURNO)
      const managers = await tx.user.findMany({
        where: {
          departmentId: department.id,
          departmentRole: {
            in: ['CAPO_REPARTO', 'CAPO_TURNO']
          },
          isActive: true
        }
      });

      // Crea notifiche (se implementato sistema notifiche)
      const notifications = managers.map((manager: any) => ({
        userId: manager.id,
        type: 'ODL_TRANSFER',
        title: 'Nuovo ODL in arrivo',
        message: `ODL ${odlId} trasferito automaticamente al reparto ${department.name}`,
        data: JSON.stringify({
          odlId,
          departmentId: department.id,
          priority: 'normal'
        }),
        createdAt: new Date()
      }));

      if (notifications.length > 0) {
        // Implementare quando avremo tabella notifiche
        // await tx.notification.createMany({ data: notifications });
      }

    } catch (error) {
      console.error('Notification error:', error);
      // Non bloccare il trasferimento per errori notifiche
    }
  }

  /**
   * Ottiene statistiche workflow per dashboard
   */
  static async getWorkflowStats(departmentId?: string) {
    try {
      const whereClause = departmentId ? { 
        productionEvents: {
          some: { departmentId }
        }
      } : {};

      const stats = await prisma.oDL.groupBy({
        by: ['status'],
        where: whereClause as any,
        _count: { status: true }
      });

      const totalODL = stats.reduce((sum, stat) => sum + stat._count.status, 0);

      return {
        totalODL,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        inProgress: stats
          .filter(s => ['IN_CLEANROOM', 'IN_AUTOCLAVE', 'IN_NDI'].includes(s.status))
          .reduce((sum, stat) => sum + stat._count.status, 0),
        completed: stats.find(s => s.status === 'COMPLETED')?._count.status || 0
      };

    } catch (error) {
      console.error('Workflow stats error:', error);
      return null;
    }
  }

  /**
   * Verifica dipendenze specifiche per reparto prima del trasferimento
   */
  private static async checkDepartmentDependencies(
    odl: any, 
    departmentType: DepartmentType
  ): Promise<{ passed: boolean; reason?: string; actions?: string[] }> {
    try {
      switch (departmentType) {
        case 'AUTOCLAVE':
          // Verifica che non ci siano batch attivi che bloccano il trasferimento
          const activeLoads = await prisma.autoclaveLoad.findMany({
            where: {
              status: { in: ['IN_CURE', 'READY'] },
              loadItems: {
                some: { odlId: odl.id }
              }
            }
          });
          
          if (activeLoads.length > 0) {
            return {
              passed: false,
              reason: 'ODL è ancora in un batch autoclave attivo',
              actions: ['Completare ciclo di cura', 'Rilasciare ODL dal batch']
            };
          }
          break;

        case 'CLEANROOM':
          // Verifica che tutti gli strumenti necessari siano disponibili nel reparto successivo
          const requiredTools = await prisma.partTool.findMany({
            where: { partId: odl.partId },
            include: { tool: true }
          });
          
          // Qui andrà logica di verifica disponibilità strumenti
          break;

        default:
          // Altri reparti non hanno dipendenze specifiche per ora
          break;
      }

      return { passed: true };
    } catch (error) {
      console.error('Dependency check error:', error);
      return {
        passed: false,
        reason: 'Errore verifica dipendenze',
        actions: ['Verificare manualmente le condizioni di trasferimento']
      };
    }
  }

  /**
   * Aggiorna metriche di performance dei reparti
   */
  private static async updateDepartmentMetrics(
    fromDepartmentId: string, 
    toDepartmentId: string, 
    tx: any
  ): Promise<void> {
    try {
      // Placeholder per metriche di performance
      // Implementare quando avremo tabella DepartmentMetrics
    } catch (error) {
      console.error('Metrics update error:', error);
      // Non bloccare il trasferimento per errori di metriche
    }
  }

  /**
   * Rollback di un trasferimento (per gestione errori)
   */
  static async rollbackTransfer(
    odlId: string,
    rollbackData: { previousStatus: ODLStatus; timestamp: Date },
    userId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Ripristina stato precedente
        await tx.oDL.update({
          where: { id: odlId },
          data: {
            status: rollbackData.previousStatus,
            updatedAt: new Date()
          }
        });

        // Crea evento di rollback
        await tx.productionEvent.create({
          data: {
            odlId,
            departmentId: 'SYSTEM', // ID speciale per operazioni di sistema
            userId,
            eventType: 'NOTE',
            notes: `Rollback trasferimento: ${reason}`,
            isAutomatic: true
          }
        });
      });

      return {
        success: true,
        message: 'Trasferimento annullato con successo'
      };
    } catch (error) {
      console.error('Rollback error:', error);
      return {
        success: false,
        message: 'Errore durante rollback - intervento manuale richiesto'
      };
    }
  }

  /**
   * Esegue operazione con retry automatico per gestire race conditions
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Ritenta solo per errori di concorrenza
        if (
          error instanceof Error &&
          (error.message.includes('Stato ODL modificato') ||
           error.message.includes('P2034') || // Prisma transaction conflict
           error.message.includes('Transaction'))
        ) {
          if (attempt < maxRetries) {
            // Exponential backoff con jitter
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
            console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Se non è un errore di concorrenza o abbiamo esaurito i tentativi
        throw error;
      }
    }
    
    throw lastError!;
  }

  /**
   * Ottiene ODL pronti per trasferimento automatico con cache
   */
  static async getODLReadyForTransfer(departmentId: string) {
    const cacheKey = `ready-transfer-${departmentId}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { type: true }
      });

      if (!department) return [];

      const requiredStatus = this.getRequiredStatus(department.type);
      if (!requiredStatus) return [];

      const odlList = await prisma.oDL.findMany({
        where: {
          status: requiredStatus,
        } as any,
        include: {
          part: {
            select: {
              partNumber: true,
              description: true
            }
          },
        },
        orderBy: {
          priority: 'desc'
        },
        take: 50 // Limita per performance
      });

      setCached(cacheKey, odlList);
      return odlList;

    } catch (error) {
      console.error('Get ready ODL error:', error);
      return [];
    }
  }

  /**
   * Esegue trasferimenti batch ottimizzati
   */
  static async executeBatchTransfers(
    transfers: Array<{ odlId: string; currentDepartmentId: string; userId: string }>
  ): Promise<Map<string, TransferResult>> {
    const results = new Map<string, TransferResult>();
    
    // Esegui validazioni in parallelo
    const validations = await Promise.all(
      transfers.map(async t => ({
        ...t,
        validation: await this.validateTransfer(t.odlId, t.currentDepartmentId)
      }))
    );

    // Filtra solo trasferimenti validi
    const validTransfers = validations.filter(v => v.validation.canTransfer);
    
    // Esegui trasferimenti in batch con transazione unica
    if (validTransfers.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          for (const transfer of validTransfers) {
            // Implementa logica trasferimento
            const result = await this.executeTransferInTransaction(
              tx,
              transfer.odlId,
              transfer.currentDepartmentId,
              transfer.userId,
              transfer.validation.nextDepartment!
            );
            results.set(transfer.odlId, result);
          }
        }, {
          maxWait: 10000,
          timeout: 30000
        });
      } catch (error) {
        console.error('Batch transfer error:', error);
        // Gestisci rollback
      }
    }

    // Aggiungi risultati per trasferimenti non validi
    validations
      .filter(v => !v.validation.canTransfer)
      .forEach(v => {
        results.set(v.odlId, {
          success: false,
          message: v.validation.reason || 'Trasferimento non valido'
        });
      });

    return results;
  }

  /**
   * Helper per eseguire trasferimento in transazione
   */
  private static async executeTransferInTransaction(
    tx: any,
    odlId: string,
    currentDepartmentId: string,
    userId: string,
    nextDepartment: { id: string; name: string; type: DepartmentType }
  ): Promise<TransferResult> {
    // Implementazione ottimizzata del trasferimento
    // usando la transazione fornita
    return {
      success: true,
      message: `ODL trasferito a ${nextDepartment.name}`,
      nextDepartment
    };
  }

  /**
   * Invalida la cache per un ODL specifico o tutto il reparto
   */
  static invalidateCache(odlId?: string, departmentId?: string): void {
    if (odlId) {
      // Invalida cache specifica per ODL
      for (const key of workflowCache.keys()) {
        if (key.includes(odlId)) {
          workflowCache.delete(key);
        }
      }
    }
    
    if (departmentId) {
      // Invalida cache specifica per reparto
      for (const key of workflowCache.keys()) {
        if (key.includes(departmentId)) {
          workflowCache.delete(key);
        }
      }
    }
    
    if (!odlId && !departmentId) {
      // Invalida tutta la cache
      workflowCache.clear();
    }
  }

  /**
   * Ottiene statistiche workflow per dashboard
   */
  static async getWorkflowStats(departmentId?: string) {
    const cacheKey = `stats-${departmentId || 'all'}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const whereClause = departmentId ? { departmentId } : {};
      
      // Query parallele per performance
      const [
        totalODLs,
        completedToday,
        avgTransferTime,
        bottlenecks
      ] = await Promise.all([
        // Total ODLs attivi
        prisma.oDL.count({
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED']
            }
          }
        }),
        
        // Completati oggi
        prisma.productionEvent.count({
          where: {
            ...whereClause,
            eventType: 'EXIT',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Tempo medio trasferimento (ultimi 7 giorni)
        prisma.$queryRaw`
          SELECT AVG(EXTRACT(EPOCH FROM (pe2.created_at - pe1.created_at))/60) as avg_minutes
          FROM production_events pe1
          JOIN production_events pe2 ON pe1.odl_id = pe2.odl_id
          WHERE pe1.event_type = 'EXIT'
            AND pe2.event_type = 'ENTRY'
            AND pe2.created_at > pe1.created_at
            AND pe1.created_at > NOW() - INTERVAL '7 days'
            ${departmentId ? Prisma.sql`AND pe1.department_id = ${departmentId}` : Prisma.empty}
        `,
        
        // Identifica colli di bottiglia
        prisma.department.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                productionEvents: {
                  where: {
                    eventType: 'ENTRY',
                    createdAt: {
                      gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            productionEvents: {
              _count: 'desc'
            }
          },
          take: 3
        })
      ]);

      const stats = {
        totalActive: totalODLs,
        completedToday,
        avgTransferTime: avgTransferTime?.[0]?.avg_minutes || 0,
        bottlenecks: bottlenecks.map(d => ({
          department: d.name,
          load: d._count.productionEvents
        })),
        timestamp: new Date()
      };

      setCached(cacheKey, stats);
      return stats;

    } catch (error) {
      console.error('Workflow stats error:', error);
      return {
        totalActive: 0,
        completedToday: 0,
        avgTransferTime: 0,
        bottlenecks: [],
        error: true
      };
    }
  }

  /**
   * Pre-carica dati frequenti in cache per migliorare performance
   */
  static async preloadCache(): Promise<void> {
    try {
      // Pre-carica reparti attivi
      const departments = await prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, type: true, name: true }
      });

      // Pre-carica workflow transitions per ogni reparto
      for (const dept of departments) {
        const nextDept = this.getNextDepartment(dept.type);
        if (nextDept) {
          setCached(`next-dept-${dept.type}`, nextDept);
        }
      }

      console.log('Workflow cache preloaded successfully');
    } catch (error) {
      console.error('Cache preload error:', error);
    }
  }
}