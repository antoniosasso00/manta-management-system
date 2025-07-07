import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validazione
const CuringCycleSchema = z.object({
  code: z.string().min(1, "Codice obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().nullable().optional(),
  phase1Temperature: z.number().positive("Temperatura fase 1 deve essere positiva"),
  phase1Pressure: z.number().positive("Pressione fase 1 deve essere positiva"),
  phase1Duration: z.number().int().positive("Durata fase 1 deve essere positiva"),
  phase2Temperature: z.number().positive().nullable().optional(),
  phase2Pressure: z.number().positive().nullable().optional(),
  phase2Duration: z.number().int().positive().nullable().optional(),
  isActive: z.boolean()
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const cycles = await prisma.curingCycle.findMany({
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Errore nel recupero cicli:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei cicli di cura' },
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
    const validatedData = CuringCycleSchema.parse(body);
    
    // Verifica se il codice è già in uso
    const existing = await prisma.curingCycle.findUnique({
      where: { code: validatedData.code }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Codice già in uso' },
        { status: 400 }
      );
    }

    // Crea ciclo
    const cycle = await prisma.curingCycle.create({
      data: validatedData
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nella creazione ciclo:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del ciclo di cura' },
      { status: 500 }
    );
  }
}