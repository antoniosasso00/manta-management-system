import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  phase1Temperature: z.number().positive().optional(),
  phase1Pressure: z.number().positive().optional(),
  phase1Duration: z.number().int().positive().optional(),
  phase2Temperature: z.number().positive().nullable().optional(),
  phase2Pressure: z.number().positive().nullable().optional(),
  phase2Duration: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateSchema.parse(body);

    const cycle = await prisma.curingCycle.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(cycle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nell\'aggiornamento ciclo:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del ciclo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se ci sono ODL o carichi associati
    const [odls, loads, partConfigs] = await Promise.all([
      prisma.oDL.count({ where: { curingCycleId: id } }),
      prisma.autoclaveLoad.count({ where: { curingCycleId: id } }),
      prisma.partAutoclave.count({ where: { curingCycleId: id } })
    ]);

    if (odls > 0 || loads > 0 || partConfigs > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: ciclo in uso' },
        { status: 400 }
      );
    }

    await prisma.curingCycle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione ciclo:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del ciclo' },
      { status: 500 }
    );
  }
}