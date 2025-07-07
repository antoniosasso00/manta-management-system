import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { PartAutoclaveService } from '@/domains/autoclave/services/PartAutoclaveService';
import { z } from 'zod';

const PartAutoclaveSchema = z.object({
  partId: z.string().min(1, "Part ID obbligatorio"),
  curingCycleId: z.string().min(1, "Ciclo cura obbligatorio"),
  vacuumLines: z.number().int().min(0, "Valvole deve essere >= 0"),
  setupTime: z.number().int().min(0).nullable().optional(),
  loadPosition: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      partNumber: searchParams.get('partNumber') || undefined,
      curingCycleId: searchParams.get('curingCycleId') || undefined
    };

    const configs = await PartAutoclaveService.findAll(filters);

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Errore nel recupero configurazioni:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle configurazioni' },
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
    const validatedData = PartAutoclaveSchema.parse(body);
    
    // Upsert configurazione - converti null in undefined
    const config = await PartAutoclaveService.upsert({
      ...validatedData,
      setupTime: validatedData.setupTime ?? undefined,
      loadPosition: validatedData.loadPosition ?? undefined,
      notes: validatedData.notes ?? undefined
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nella creazione configurazione:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della configurazione' },
      { status: 500 }
    );
  }
}