import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { ToolService } from '@/domains/core/services/ToolService';
import { z } from 'zod';

const UpdateSchema = z.object({
  toolPartNumber: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  base: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().nullable().optional(),
  material: z.string().nullable().optional(),
  valveCount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateSchema.parse(body);

    const tool = await ToolService.update(params.id, validatedData);

    return NextResponse.json(tool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nell\'aggiornamento tool:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await ToolService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes('Tool in uso')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    console.error('Errore nell\'eliminazione tool:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del tool' },
      { status: 500 }
    );
  }
}