import { prisma } from '@/lib/prisma';
import { DepartmentType, ODLStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

interface WorkflowTransition {
  from: DepartmentType;
  to: DepartmentType | null;
  requiredStatus: ODLStatus;
  targetStatus: ODLStatus;
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

      return {
        canTransfer: true,
        nextDepartment,
        requiredActions: requiredActions.length > 0 ? requiredActions : undefined
      };

    } catch (error) {
      console.error('Workflow validation error:', error);
      return { canTransfer: false, reason: 'Errore validazione workflow' };
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

      // Esegui trasferimento in transazione atomica con timeout e retry
      const result = await prisma.$transaction(async (tx) => {
        try {
          // 1. Verifica nuovamente lo stato ODL (potrebbero esserci stati cambiamenti)
          const currentODL = await tx.oDL.findUnique({
            where: { id: validatedInput.odlId },
            select: { status: true } // Version field removed
          });

          if (!currentODL || currentODL.status !== originalODL.status) {
            throw new Error('Stato ODL modificato durante il trasferimento');
          }

          // 2. Aggiorna stato ODL con lock ottimistico
          const updatedODL = await tx.oDL.update({
            where: { 
              id: validatedInput.odlId,
              status: originalODL.status // Verifica che lo stato non sia cambiato
            },
            data: { 
              status: targetStatus,
              updatedAt: new Date()
            }
          });

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
   * Ottiene ODL pronti per trasferimento automatico
   */
  static async getODLReadyForTransfer(departmentId: string) {
    try {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      });

      if (!department) return [];

      const requiredStatus = this.getRequiredStatus(department.type);
      if (!requiredStatus) return [];

      const odlList = await prisma.oDL.findMany({
        where: {
          status: requiredStatus,
        } as any,
        include: {
          part: true,
        }
      });

      return odlList;

    } catch (error) {
      console.error('Get ready ODL error:', error);
      return [];
    }
  }
}