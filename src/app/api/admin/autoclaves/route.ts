import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { AutoclaveService } from '@/domains/autoclave/services/autoclave-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validazione
const AutoclaveSchema = z.object({
  code: z.string().min(1, "Codice obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  maxLength: z.number().positive("Lunghezza deve essere positiva"),
  maxWidth: z.number().positive("Larghezza deve essere positiva"),
  maxHeight: z.number().positive("Altezza deve essere positiva"),
  vacuumLines: z.number().int().min(0, "Linee vuoto deve essere >= 0"),
  isActive: z.boolean()
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Trova tutti gli autoclavi con info dipartimento
    const autoclaves = await prisma.autoclave.findMany({
      include: {
        department: true
      },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(autoclaves);
  } catch (error) {
    console.error('Errore nel recupero autoclavi:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli autoclavi' },
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
    const validatedData = AutoclaveSchema.parse(body);
    
    // Trova dipartimento autoclavi
    const autoDept = await prisma.department.findFirst({
      where: { type: 'AUTOCLAVE' }
    });
    
    if (!autoDept) {
      return NextResponse.json(
        { error: 'Dipartimento autoclavi non trovato' },
        { status: 400 }
      );
    }

    // Crea autoclave
    const autoclave = await prisma.autoclave.create({
      data: {
        ...validatedData,
        departmentId: autoDept.id
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(autoclave, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Errore nella creazione autoclave:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'autoclave' },
      { status: 500 }
    );
  }
}