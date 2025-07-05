import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { WorkflowService } from '@/domains/production/services/WorkflowService';
import { z } from 'zod';
import { withRateLimit, workflowRateLimiter } from '@/lib/rate-limit-middleware';

const TransferRequestSchema = z.object({
  odlId: z.string().cuid(),
  departmentId: z.string().cuid().optional()
});

async function postHandler(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Valida input
    const body = await request.json();
    const { odlId, departmentId } = TransferRequestSchema.parse(body);

    // Usa reparto dell'utente se non specificato
    const currentDepartmentId = departmentId || session.user.departmentId;
    
    if (!currentDepartmentId) {
      return NextResponse.json(
        { error: 'Reparto non specificato' },
        { status: 400 }
      );
    }

    // Esegui trasferimento automatico
    const result = await WorkflowService.executeAutoTransfer(
      odlId,
      currentDepartmentId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      newStatus: result.newStatus,
      nextDepartment: result.nextDepartment
    });

  } catch (error) {
    console.error('Transfer API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId') || session.user.departmentId;

    if (!departmentId) {
      return NextResponse.json(
        { error: 'Reparto non specificato' },
        { status: 400 }
      );
    }

    // Ottieni ODL pronti per trasferimento
    const readyODL = await WorkflowService.getODLReadyForTransfer(departmentId);

    return NextResponse.json({
      count: readyODL.length,
      odl: readyODL
    });

  } catch (error) {
    console.error('Get ready ODL error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const POST = withRateLimit(postHandler, workflowRateLimiter);
export const GET = withRateLimit(getHandler, workflowRateLimiter);