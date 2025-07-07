import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  maxLength: z.number().positive().optional(),
  maxWidth: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
  vacuumLines: z.number().int().min(0).optional(),
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

    const autoclave = await prisma.autoclave.update({
      where: { id },
      data: validatedData,
      include: {
        department: true
      }
    });

    return NextResponse.json(autoclave);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nell\'aggiornamento autoclave:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'autoclave' },
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

    // Verifica se ci sono carichi associati
    const loads = await prisma.autoclaveLoad.count({
      where: { autoclaveId: id }
    });

    if (loads > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: ci sono carichi associati' },
        { status: 400 }
      );
    }

    await prisma.autoclave.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione autoclave:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'autoclave' },
      { status: 500 }
    );
  }
}