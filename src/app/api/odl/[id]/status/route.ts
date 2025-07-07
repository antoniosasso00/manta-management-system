import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { WorkflowService } from '@/domains/production/services/WorkflowService';
import { z } from 'zod';

export const runtime = 'nodejs';
import { ODL_STATUS } from '@/utils/constants';

// Schema per validazione cambio stato
const statusChangeSchema = z.object({
  newStatus: z.enum([
    'CREATED',
    'IN_CLEANROOM',
    'CLEANROOM_COMPLETED', 
    'IN_AUTOCLAVE',
    'AUTOCLAVE_COMPLETED',
    'IN_CONTROLLO_NUMERICO',
    'CONTROLLO_NUMERICO_COMPLETED',
    'IN_NDI',
    'NDI_COMPLETED',
    'IN_MONTAGGIO',
    'MONTAGGIO_COMPLETED',
    'IN_VERNICIATURA',
    'VERNICIATURA_COMPLETED',
    'IN_CONTROLLO_QUALITA',
    'CONTROLLO_QUALITA_COMPLETED',
    'COMPLETED',
    'ON_HOLD',
    'CANCELLED'
  ] as const),
  reason: z.string().min(1, 'Motivo richiesto per cambio stato manuale'),
  forceChange: z.boolean().default(false),
  bypassWorkflow: z.boolean().default(false)
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/odl/[id]/status
 * Aggiorna direttamente lo stato di un ODL con validazioni workflow
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params Promise
    const { id } = await params;
    
    // Verifica autenticazione
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica permessi (ADMIN, SUPERVISOR o CAPO_REPARTO)
    const user = await prisma.user.findUnique({
      where: { id: token.sub! },
      select: { 
        id: true, 
        email: true,
        role: true, 
        departmentRole: true, 
        departmentId: true,
        department: {
          select: { name: true, type: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const canChangeStatus = user.role === 'ADMIN' || 
                           user.role === 'SUPERVISOR' ||
                           user.departmentRole === 'CAPO_REPARTO' ||
                           user.departmentRole === 'CAPO_TURNO';

    if (!canChangeStatus) {
      return NextResponse.json({ 
        error: 'Permessi insufficienti per cambio stato manuale' 
      }, { status: 403 });
    }

    // Valida input
    const body = await request.json();
    const validation = statusChangeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Dati non validi',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { newStatus, reason, forceChange, bypassWorkflow } = validation.data;

    // Recupera ODL attuale
    const odl = await prisma.oDL.findUnique({
      where: { id },
      include: {
        part: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    if (!odl) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 });
    }

    // Salva stato precedente per audit
    const previousStatus = odl.status;

    // Validazione workflow se non bypassed
    if (!bypassWorkflow && !forceChange) {
      const workflowValidation = await validateStatusTransition(
        odl.status,
        newStatus,
        odl,
        user
      );

      if (!workflowValidation.valid) {
        return NextResponse.json({
          error: 'Transizione di stato non valida',
          reason: workflowValidation.reason,
          suggestions: workflowValidation.suggestions
        }, { status: 400 });
      }
    }

    // Esegui cambio stato in transazione
    const result = await prisma.$transaction(async (tx) => {
      // 1. Aggiorna stato ODL
      const updatedODL = await tx.oDL.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // 2. Crea evento di cambio stato manuale
      await tx.productionEvent.create({
        data: {
          odlId: (await params).id,
          departmentId: user.departmentId || 'SYSTEM',
          userId: user.id,
          eventType: 'NOTE',
          notes: `Cambio stato manuale: ${previousStatus} → ${newStatus}. Motivo: ${reason}`,
          isAutomatic: false
        }
      });

      // 3. Crea log audit per tracciabilità
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'UPDATE',
          resource: 'ODL',
          resourceId: (await params).id,
          details: JSON.stringify({
            previousStatus,
            newStatus,
            reason,
            forceChange,
            bypassWorkflow,
            userRole: user.role,
            departmentRole: user.departmentRole,
            odlNumber: odl.odlNumber,
            partNumber: odl.part.partNumber,
            department: user.department?.name
          })
        }
      });

      return updatedODL;
    });

    return NextResponse.json({
      success: true,
      message: `Stato ODL aggiornato da ${previousStatus} a ${newStatus}`,
      odl: {
        id: result.id,
        status: result.status,
        updatedAt: result.updatedAt
      },
      audit: {
        previousStatus,
        newStatus,
        changedBy: user.id,
        reason
      }
    });

  } catch (error) {
    console.error('Error updating ODL status:', error);
    return NextResponse.json({
      error: 'Errore interno server durante cambio stato',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}

/**
 * Valida se una transizione di stato è consentita secondo il workflow
 */
async function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  odl: any,
  user: any
): Promise<{
  valid: boolean;
  reason?: string;
  suggestions?: string[];
}> {
  // Stati che possono sempre essere impostati da ADMIN
  if (user.role === 'ADMIN') {
    return { valid: true };
  }

  // Stati finali non possono essere cambiati senza permessi ADMIN
  if (['COMPLETED', 'CANCELLED'].includes(currentStatus) && user.role !== 'ADMIN') {
    return {
      valid: false,
      reason: 'Solo gli amministratori possono modificare ODL completati o cancellati',
      suggestions: ['Contattare un amministratore', 'Verificare se serve un nuovo ODL']
    };
  }

  // Validazioni specifiche per workflow sequenziale
  const workflowOrder = [
    'CREATED',
    'IN_CLEANROOM',
    'CLEANROOM_COMPLETED',
    'IN_AUTOCLAVE', 
    'AUTOCLAVE_COMPLETED',
    'IN_CONTROLLO_NUMERICO',
    'CONTROLLO_NUMERICO_COMPLETED',
    'IN_NDI',
    'NDI_COMPLETED',
    'IN_MONTAGGIO',
    'MONTAGGIO_COMPLETED',
    'IN_VERNICIATURA',
    'VERNICIATURA_COMPLETED',
    'IN_CONTROLLO_QUALITA',
    'CONTROLLO_QUALITA_COMPLETED',
    'COMPLETED'
  ];

  const currentIndex = workflowOrder.indexOf(currentStatus);
  const newIndex = workflowOrder.indexOf(newStatus);

  // Consenti movimento in avanti o ON_HOLD
  if (newStatus === 'ON_HOLD' || newIndex > currentIndex) {
    return { valid: true };
  }

  // Movimento all'indietro richiede giustificazione speciale
  if (newIndex < currentIndex && newIndex >= 0) {
    // Supervisor può muovere indietro di max 2 posizioni
    if (user.role === 'SUPERVISOR' && (currentIndex - newIndex) <= 2) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: 'Movimento all\'indietro nel workflow richiede permessi superiori',
      suggestions: [
        'Contattare un supervisore o amministratore',
        'Usare flag forceChange se autorizzato',
        'Verificare se il movimento è necessario'
      ]
    };
  }

  // Stati non validi o salti troppo grandi
  if (newIndex < 0 || (newIndex - currentIndex) > 3) {
    return {
      valid: false,
      reason: 'Transizione di stato troppo ampia o non valida',
      suggestions: [
        'Seguire il workflow sequenziale',
        'Completare le fasi intermedie',
        'Verificare lo stato target'
      ]
    };
  }

  return { valid: true };
}