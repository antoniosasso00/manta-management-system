import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const advanceBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID richiesto'),
  targetStatus: z.enum(['READY', 'IN_CURE', 'COMPLETED', 'RELEASED']),
  scannedOdlId: z.string().optional(), // ODL scansionato per trigger avanzamento
});

// POST /api/autoclavi/batches/advance - Avanza stato batch
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, targetStatus, scannedOdlId } = advanceBatchSchema.parse(body);

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

    if (!batch) {
      return NextResponse.json({ error: 'Batch non trovato' }, { status: 404 });
    }

    // Se è stato scansionato un ODL, verifica che appartenga al batch
    if (scannedOdlId) {
      const odlInBatch = batch.loadItems.find(item => item.odl.id === scannedOdlId);
      if (!odlInBatch) {
        return NextResponse.json(
          { error: 'ODL scansionato non appartiene a questo batch' },
          { status: 400 }
        );
      }
    }

    // Validazione transizioni di stato
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['READY', 'CANCELLED'],
      'READY': ['IN_CURE', 'DRAFT', 'CANCELLED'],
      'IN_CURE': ['COMPLETED', 'READY', 'CANCELLED'],
      'COMPLETED': ['RELEASED', 'IN_CURE'],
      'RELEASED': [], // Stato finale
      'CANCELLED': ['DRAFT'], // Solo se necessario riattivare
    };

    if (!validTransitions[batch.status]?.includes(targetStatus)) {
      return NextResponse.json(
        { 
          error: `Transizione non valida da ${batch.status} a ${targetStatus}`,
          validTransitions: validTransitions[batch.status],
        },
        { status: 400 }
      );
    }

    // Logica specifica per ogni transizione
    const result = await prisma.$transaction(async (tx) => {
      let updatedBatch;
      let message = '';
      const odlUpdates: any[] = [];

      switch (targetStatus) {
        case 'READY':
          updatedBatch = await tx.autoclaveLoad.update({
            where: { id: batchId },
            data: { 
              status: 'READY',
              // Imposta actualStart se non già impostato
              actualStart: batch.actualStart || (batch.status === 'DRAFT' ? new Date() : batch.actualStart),
            },
          });
          message = 'Batch pronto per avvio cura';
          break;

        case 'IN_CURE':
          updatedBatch = await tx.autoclaveLoad.update({
            where: { id: batchId },
            data: { 
              status: 'IN_CURE',
              actualStart: batch.actualStart || new Date(),
            },
          });
          message = 'Ciclo di cura avviato';
          break;

        case 'COMPLETED':
          updatedBatch = await tx.autoclaveLoad.update({
            where: { id: batchId },
            data: { 
              status: 'COMPLETED',
              actualEnd: new Date(),
            },
          });
          
          // Avanza tutti gli ODL del batch
          for (const item of batch.loadItems) {
            await tx.oDL.update({
              where: { id: item.odl.id },
              data: { status: 'AUTOCLAVE_COMPLETED' },
            });
            odlUpdates.push(item.odl.odlNumber);
          }
          
          message = `Cura completata - ${batch.loadItems.length} ODL avanzati`;
          break;

        case 'RELEASED':
          updatedBatch = await tx.autoclaveLoad.update({
            where: { id: batchId },
            data: { status: 'RELEASED' },
          });
          
          // Trasferisci tutti gli ODL al reparto successivo
          for (const item of batch.loadItems) {
            await tx.oDL.update({
              where: { id: item.odl.id },
              data: { status: 'IN_NDI' },
            });
            odlUpdates.push(item.odl.odlNumber);
          }
          
          message = `Batch rilasciato - ${batch.loadItems.length} ODL trasferiti al reparto NDI`;
          break;

        default:
          throw new Error(`Stato target non supportato: ${targetStatus}`);
      }

      // Log evento di produzione per tracciabilità
      await tx.productionEvent.create({
        data: {
          odlId: batch.loadItems[0]?.odl.id || '', // Primo ODL come rappresentativo
          departmentId: batch.autoclave.departmentId,
          eventType: 'EXIT',
          notes: `Batch ${batch.loadNumber} avanzato da ${batch.status} a ${targetStatus}`,
          userId: session.user.id,
        },
      });

      return { updatedBatch, message, odlUpdates };
    });

    return NextResponse.json({
      success: true,
      batch: result.updatedBatch,
      message: result.message,
      odlUpdates: result.odlUpdates,
      scannedOdl: scannedOdlId ? batch.loadItems.find(item => item.odl.id === scannedOdlId)?.odl.odlNumber : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore avanzamento batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}