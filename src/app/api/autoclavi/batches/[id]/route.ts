import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBatchSchema = z.object({
  status: z.enum(['DRAFT', 'READY', 'IN_CURE', 'COMPLETED', 'RELEASED', 'CANCELLED']).optional(),
  plannedStart: z.string().transform((str) => new Date(str)).optional(),
  plannedEnd: z.string().transform((str) => new Date(str)).optional(),
  actualStart: z.string().transform((str) => new Date(str)).optional(),
  actualEnd: z.string().transform((str) => new Date(str)).optional(),
});

// GET /api/autoclavi/batches/[id] - Dettaglio batch
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const batch = await prisma.autoclaveLoad.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        odlCount: batch.loadItems.length,
        totalQuantity: batch.loadItems.reduce((sum, item) => sum + item.odl.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Errore recupero batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PATCH /api/autoclavi/batches/[id] - Aggiorna batch
export async function PATCH(
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
    const validatedData = updateBatchSchema.parse(body);

    const currentBatch = await prisma.autoclaveLoad.findUnique({
      where: { id: params.id },
      include: {
        loadItems: {
          include: {
            odl: true,
          },
        },
      },
    });

    if (!currentBatch) {
      return NextResponse.json({ error: 'Batch non trovato' }, { status: 404 });
    }

    // Logica speciale per avanzamento a COMPLETED
    if (validatedData.status === 'COMPLETED' && currentBatch.status === 'IN_CURE') {
      const batch = await prisma.$transaction(async (tx) => {
        // Aggiorna batch
        const updatedBatch = await tx.autoclaveLoad.update({
          where: { id: params.id },
          data: {
            ...validatedData,
            actualEnd: validatedData.actualEnd || new Date(),
          },
        });

        // Avanza tutti gli ODL del batch
        await Promise.all(
          currentBatch.loadItems.map(async (item) => {
            await tx.oDL.update({
              where: { id: item.odl.id },
              data: { status: 'AUTOCLAVE_COMPLETED' },
            });
          })
        );

        return updatedBatch;
      });

      return NextResponse.json({
        success: true,
        batch,
        message: 'Batch completato - Tutti gli ODL sono stati avanzati',
      });
    }

    // Logica speciale per avanzamento a RELEASED
    if (validatedData.status === 'RELEASED' && currentBatch.status === 'COMPLETED') {
      const batch = await prisma.$transaction(async (tx) => {
        // Aggiorna batch
        const updatedBatch = await tx.autoclaveLoad.update({
          where: { id: params.id },
          data: validatedData,
        });

        // Avanza tutti gli ODL al reparto successivo (NDI)
        await Promise.all(
          currentBatch.loadItems.map(async (item) => {
            await tx.oDL.update({
              where: { id: item.odl.id },
              data: { status: 'IN_NDI' },
            });
          })
        );

        return updatedBatch;
      });

      return NextResponse.json({
        success: true,
        batch,
        message: 'Batch rilasciato - Tutti gli ODL sono stati trasferiti al reparto NDI',
      });
    }

    // Aggiornamento standard
    const batch = await prisma.autoclaveLoad.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      batch,
      message: 'Batch aggiornato con successo',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore aggiornamento batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/autoclavi/batches/[id] - Elimina batch
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

    const batch = await prisma.autoclaveLoad.findUnique({
      where: { id: params.id },
      include: {
        loadItems: {
          include: {
            odl: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch non trovato' }, { status: 404 });
    }

    // Non permettere eliminazione se batch è in corso o completato
    if (['IN_CURE', 'COMPLETED', 'RELEASED'].includes(batch.status)) {
      return NextResponse.json(
        { error: 'Impossibile eliminare batch in corso o completato' },
        { status: 400 }
      );
    }

    // Elimina batch e ripristina ODL
    await prisma.$transaction(async (tx) => {
      // Ripristina stato precedente degli ODL
      await Promise.all(
        batch.loadItems.map(async (item) => {
          await tx.oDL.update({
            where: { id: item.odl.id },
            data: { status: item.previousStatus || 'CLEANROOM_COMPLETED' },
          });
        })
      );

      // Elimina batch (loadItems eliminati per CASCADE)
      await tx.autoclaveLoad.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Batch eliminato e ODL ripristinati',
    });
  } catch (error) {
    console.error('Errore eliminazione batch:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}