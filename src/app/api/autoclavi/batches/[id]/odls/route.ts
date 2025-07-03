import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addOdlToBatchSchema = z.object({
  odlIds: z.array(z.string()).min(1, 'Almeno un ODL richiesto'),
});

const removeOdlFromBatchSchema = z.object({
  odlId: z.string().min(1, 'ODL richiesto'),
});

// POST /api/autoclavi/batches/[id]/odls - Aggiungi ODL al batch
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { odlIds } = addOdlToBatchSchema.parse(body);

    const batch = await prisma.autoclaveLoad.findUnique({
      where: { id: params.id },
      include: {
        curingCycle: true,
        loadItems: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch non trovato' }, { status: 404 });
    }

    // Verifica che gli ODL siano disponibili
    const odls = await prisma.oDL.findMany({
      where: {
        id: { in: odlIds },
        status: 'CLEANROOM_COMPLETED',
      },
      include: {
        part: true,
        curingCycle: true,
      },
    });

    if (odls.length !== odlIds.length) {
      return NextResponse.json(
        { error: 'Alcuni ODL non sono disponibili' },
        { status: 400 }
      );
    }

    // Verifica compatibilità cicli di cura
    const incompatibleOdls = odls.filter(odl => {
      const odlCycleId = odl.curingCycleId || odl.part.defaultCuringCycleId;
      return odlCycleId !== batch.curingCycleId;
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

    // Aggiungi ODL al batch
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        odls.map(async (odl) => {
          // Verifica che l'ODL non sia già nel batch
          const existingItem = await tx.autoclaveLoadItem.findUnique({
            where: {
              odlId_autoclaveLoadId: {
                odlId: odl.id,
                autoclaveLoadId: batch.id,
              },
            },
          });

          if (!existingItem) {
            await tx.autoclaveLoadItem.create({
              data: {
                odlId: odl.id,
                autoclaveLoadId: batch.id,
                previousStatus: odl.status,
              },
            });

            await tx.oDL.update({
              where: { id: odl.id },
              data: { status: 'IN_AUTOCLAVE' },
            });
          }
        })
      );
    });

    return NextResponse.json({
      success: true,
      message: 'ODL aggiunti al batch con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore aggiunta ODL al batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/autoclavi/batches/[id]/odls - Rimuovi ODL dal batch
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { odlId } = removeOdlFromBatchSchema.parse(body);

    const batch = await prisma.autoclaveLoad.findUnique({
      where: { id: params.id },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch non trovato' }, { status: 404 });
    }

    const loadItem = await prisma.autoclaveLoadItem.findUnique({
      where: {
        odlId_autoclaveLoadId: {
          odlId: odlId,
          autoclaveLoadId: batch.id,
        },
      },
    });

    if (!loadItem) {
      return NextResponse.json(
        { error: 'ODL non trovato nel batch' },
        { status: 404 }
      );
    }

    // Rimuovi ODL dal batch e ripristina stato precedente
    await prisma.$transaction(async (tx) => {
      // Ripristina stato precedente dell'ODL
      await tx.oDL.update({
        where: { id: odlId },
        data: { status: loadItem.previousStatus || 'CLEANROOM_COMPLETED' },
      });

      // Rimuovi dal batch
      await tx.autoclaveLoadItem.delete({
        where: {
          odlId_autoclaveLoadId: {
            odlId: odlId,
            autoclaveLoadId: batch.id,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'ODL rimosso dal batch e stato ripristinato',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore rimozione ODL dal batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}