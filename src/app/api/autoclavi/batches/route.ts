import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

// Schema per creazione batch
const createBatchSchema = z.object({
  autoclaveId: z.string().min(1, 'Autoclave richiesta'),
  curingCycleId: z.string().min(1, 'Ciclo di cura richiesto'),
  plannedStart: z.string().transform((str) => new Date(str)),
  plannedEnd: z.string().transform((str) => new Date(str)),
  odlIds: z.array(z.string()).min(1, 'Almeno un ODL richiesto'),
});

// GET /api/autoclavi/batches - Lista tutti i batch
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const autoclaveId = searchParams.get('autoclaveId');

    const where: any = {};
    if (status) where.status = status;
    if (autoclaveId) where.autoclaveId = autoclaveId;

    const batches = await prisma.autoclaveLoad.findMany({
      where,
      include: {
        autoclave: true,
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

    return NextResponse.json({
      success: true,
      batches: batches.map(batch => ({
        ...batch,
        odlCount: batch.loadItems.length,
        totalQuantity: batch.loadItems.reduce((sum, item) => sum + item.odl.quantity, 0),
      })),
    });
  } catch (error) {
    console.error('Errore recupero batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/autoclavi/batches - Crea nuovo batch
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBatchSchema.parse(body);

    // Verifica che tutti gli ODL siano disponibili
    const odls = await prisma.oDL.findMany({
      where: {
        id: { in: validatedData.odlIds },
        status: 'CLEANROOM_COMPLETED', // Solo ODL completati in Clean Room
      },
      include: {
        part: {
          include: {
            autoclaveConfig: {
              include: {
                curingCycle: true,
              }
            },
            partTools: {
              include: {
                tool: true,
              }
            }
          }
        }
      },
    });

    if (odls.length !== validatedData.odlIds.length) {
      return NextResponse.json(
        { error: 'Alcuni ODL non sono disponibili per il batch' },
        { status: 400 }
      );
    }

    // Verifica compatibilità cicli di cura
    const targetCycle = await prisma.curingCycle.findUnique({
      where: { id: validatedData.curingCycleId },
    });

    if (!targetCycle) {
      return NextResponse.json(
        { error: 'Ciclo di cura non trovato' },
        { status: 400 }
      );
    }

    // Controlla che tutti gli ODL siano compatibili con il ciclo
    const incompatibleOdls = odls.filter(odl => {
      const odlCycleId = odl.part.autoclaveConfig?.curingCycleId;
      return odlCycleId !== validatedData.curingCycleId;
    });

    if (incompatibleOdls.length > 0) {
      return NextResponse.json(
        { 
          error: 'ODL con cicli di cura incompatibili',
          incompatibleOdls: incompatibleOdls.map(odl => odl.odlNumber),
        },
        { status: 400 }
      );
    }

    // Genera numero batch
    const batchCount = await prisma.autoclaveLoad.count();
    const loadNumber = `B-${new Date().getFullYear()}-${String(batchCount + 1).padStart(3, '0')}`;

    // Crea batch in transazione
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.autoclaveLoad.create({
        data: {
          loadNumber,
          autoclaveId: validatedData.autoclaveId,
          curingCycleId: validatedData.curingCycleId,
          plannedStart: validatedData.plannedStart,
          plannedEnd: validatedData.plannedEnd,
          status: 'DRAFT',
        },
      });

      // Aggiungi ODL al batch e aggiorna loro stato
      await Promise.all(
        odls.map(async (odl) => {
          await tx.autoclaveLoadItem.create({
            data: {
              odlId: odl.id,
              autoclaveLoadId: newBatch.id,
              previousStatus: odl.status, // Salva stato precedente
            },
          });

          await tx.oDL.update({
            where: { id: odl.id },
            data: { status: 'IN_AUTOCLAVE' },
          });
        })
      );

      return newBatch;
    });

    // Recupera batch completo per risposta
    const fullBatch = await prisma.autoclaveLoad.findUnique({
      where: { id: batch.id },
      include: {
        autoclave: true,
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

    return NextResponse.json({
      success: true,
      batch: fullBatch,
      message: `Batch ${loadNumber} creato con successo`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore creazione batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}