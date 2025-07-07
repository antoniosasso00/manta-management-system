import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { ToolService } from '@/domains/core/services/ToolService';
import { z } from 'zod';

const ToolSchema = z.object({
  toolPartNumber: z.string().min(1, "Part number tool obbligatorio"),
  description: z.string().nullable().optional(),
  base: z.number().positive("Base deve essere positiva"),
  height: z.number().positive("Altezza deve essere positiva"),
  weight: z.number().positive().nullable().optional(),
  material: z.string().nullable().optional(),
  valveCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.has('isActive') 
        ? searchParams.get('isActive') === 'true'
        : undefined
    };

    const tools = await ToolService.findAll(filters);

    return NextResponse.json(tools);
  } catch (error) {
    console.error('Errore nel recupero tool:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei tool' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    
    // Valida input
    const validatedData = ToolSchema.parse(body);
    
    // Crea tool - converti null in undefined
    const tool = await ToolService.create({
      ...validatedData,
      description: validatedData.description ?? undefined,
      weight: validatedData.weight ?? undefined,
      material: validatedData.material ?? undefined
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nella creazione tool:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del tool' },
      { status: 500 }
    );
  }
}