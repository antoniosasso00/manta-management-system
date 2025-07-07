import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { AutoclaveService } from '@/domains/autoclave/services/autoclave-service';
import { ODLService } from '@/domains/core/services/ODLService';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { optimizationId, confirmedBatchIds, rejectedBatchIds } = body;

    // Recupera sessione ottimizzazione
    const optimizationSession = (global as any).optimizationSessions?.[optimizationId];
    if (!optimizationSession) {
      return NextResponse.json(
        { error: 'Sessione di ottimizzazione non trovata o scaduta' },
        { status: 404 }
      );
    }

    // Trova batch confermati
    const confirmedBatches = optimizationSession.result.batches.filter(
      (batch: any) => confirmedBatchIds.includes(batch.batch_id)
    );

    if (confirmedBatches.length === 0) {
      return NextResponse.json(
        { error: 'Nessun batch selezionato per la conferma' },
        { status: 400 }
      );
    }

    // Crea batch nel database
    const createdBatches = [];

    for (const batch of confirmedBatches) {
      // Trova ODL dal batch
      const odlIds = [...new Set(batch.placements.map((p: any) => p.odl_id))] as string[];
      
      // Trova ciclo di cura
      const firstOdl = optimizationSession.odls.find((o: any) => o.id === odlIds[0]);
      const curingCycleId = firstOdl?.curingCycleId || firstOdl?.part.defaultCuringCycleId;

      if (!curingCycleId) {
        console.error(`Ciclo di cura non trovato per ODL ${odlIds[0]}`);
        continue;
      }

      // Calcola tempi pianificati (esempio: 4 ore di ciclo)
      const plannedStart = new Date();
      const plannedEnd = new Date(plannedStart.getTime() + 4 * 60 * 60 * 1000);

      // Prepara layout data
      const layoutData = {
        placements: batch.placements,
        metrics: batch.metrics,
        layoutImageBase64: batch.layout_image_base64
      };

      try {
        // Crea batch con transazione
        const createdBatch = await prisma.$transaction(async (tx) => {
          // Crea AutoclaveLoad
          const load = await AutoclaveService.createBatch({
            autoclaveId: batch.autoclave_id,
            curingCycleId,
            plannedStart,
            plannedEnd,
            layoutData,
            odlIds
          });

          // Aggiorna stato ODL
          await tx.oDL.updateMany({
            where: { id: { in: odlIds } },
            data: { status: 'IN_AUTOCLAVE' }
          });

          // Crea eventi produzione
          const events = odlIds.map(odlId => ({
            odlId,
            departmentId: optimizationSession.autoclaves
              .find((a: any) => a.id === batch.autoclave_id)?.departmentId || '',
            eventType: 'ENTRY' as const,
            timestamp: new Date(),
            userId: session.user.id,
            notes: `Caricato in autoclave tramite ottimizzazione batch ${load.loadNumber}`,
            isAutomatic: false
          }));

          await tx.productionEvent.createMany({ data: events });

          return load;
        });

        createdBatches.push(createdBatch);

      } catch (error) {
        console.error(`Errore creazione batch per autoclave ${batch.autoclave_id}:`, error);
      }
    }

    // Pulisci sessione
    delete (global as any).optimizationSessions[optimizationId];

    return NextResponse.json({
      success: true,
      createdBatches: createdBatches.length,
      batchNumbers: createdBatches.map(b => b.loadNumber)
    });

  } catch (error) {
    console.error('Errore conferma ottimizzazione:', error);
    return NextResponse.json(
      { error: 'Errore durante la conferma dell\'ottimizzazione' },
      { status: 500 }
    );
  }
}