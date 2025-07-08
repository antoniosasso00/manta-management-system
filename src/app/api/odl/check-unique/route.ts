import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const checkUniqueSchema = z.object({
  odlNumber: z.string().min(1, 'Numero ODL richiesto'),
  excludeId: z.string().optional().nullable() // Per escludere ODL corrente durante modifica
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const odlNumber = searchParams.get('odlNumber');
    const excludeId = searchParams.get('excludeId');
    

    // Early validation: se odlNumber è null o stringa vuota, ritorna subito errore
    if (!odlNumber || odlNumber.trim() === '') {
      return NextResponse.json({
        error: 'Numero ODL richiesto',
        received: { odlNumber, excludeId }
      }, { status: 400 });
    }

    // Validazione parametri
    const validation = checkUniqueSchema.safeParse({
      odlNumber: odlNumber.trim(),
      excludeId: excludeId || undefined
    });

    if (!validation.success) {
      return NextResponse.json({
        error: 'Parametri non validi',
        details: validation.error.errors,
        received: { odlNumber, excludeId }
      }, { status: 400 });
    }

    const { odlNumber: validOdlNumber, excludeId: validExcludeId } = validation.data;

    // Costruisci query per controllo unicità
    const whereConditions: any = {
      odlNumber: validOdlNumber
    };

    // Escludi ODL corrente se specificato (per operazioni di modifica)
    if (validExcludeId) {
      whereConditions.NOT = {
        id: validExcludeId
      };
    }

    // Verifica esistenza ODL con stesso progressivo
    const existingODL = await prisma.oDL.findFirst({
      where: whereConditions,
      select: {
        id: true,
        odlNumber: true,
        status: true,
        createdAt: true,
        part: {
          select: {
            partNumber: true,
            description: true
          }
        }
      }
    });

    // Risultato controllo unicità
    const isUnique = !existingODL;
    
    // Informazioni aggiuntive se progressivo non è unico
    const conflictInfo = existingODL ? {
      conflictingODL: {
        id: existingODL.id,
        progressivo: existingODL.odlNumber,
        status: existingODL.status,
        createdAt: existingODL.createdAt,
        part: existingODL.part
      }
    } : null;

    // Suggerimenti per ODL alternativo
    const suggestions = [];
    if (!isUnique) {
      // Genera suggerimenti basati sul numero ODL richiesto
      const baseOdlNumber = validOdlNumber.replace(/\d+$/, ''); // Rimuovi numeri finali
      const matches = validOdlNumber.match(/\d+$/); // Trova numeri finali
      const currentNumber = matches ? parseInt(matches[0]) : 1;
      
      for (let i = 1; i <= 3; i++) {
        const suggestedOdlNumber = `${baseOdlNumber}${currentNumber + i}`;
        
        // Verifica se il suggerimento è disponibile
        const suggestionExists = await prisma.oDL.findFirst({
          where: { odlNumber: suggestedOdlNumber },
          select: { id: true }
        });
        
        if (!suggestionExists) {
          suggestions.push(suggestedOdlNumber);
        }
      }
    }

    // Statistiche aggiuntive per debug/analytics
    const stats = await prisma.oDL.aggregate({
      _count: { id: true },
      where: {
        odlNumber: {
          startsWith: validOdlNumber.substring(0, 3) // Primi 3 caratteri
        }
      }
    });

    const response = {
      isUnique,
      odlNumber: validOdlNumber,
      ...(conflictInfo && { conflict: conflictInfo }),
      ...(suggestions.length > 0 && { suggestions }),
      validation: {
        format: validateOdlNumberFormat(validOdlNumber),
        length: validOdlNumber.length,
        similarCount: stats._count?.id || 0
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Errore nella validazione unicità ODL:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Funzione helper per validare formato numero ODL
function validateOdlNumberFormat(odlNumber: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Verifica lunghezza (formato tipico 6-12 caratteri)
  if (odlNumber.length < 6) {
    issues.push('Numero ODL troppo corto (minimo 6 caratteri)');
    suggestions.push('Aggiungere caratteri o numeri per raggiungere la lunghezza minima');
  }
  
  if (odlNumber.length > 12) {
    issues.push('Numero ODL troppo lungo (massimo 12 caratteri)');
    suggestions.push('Ridurre la lunghezza del numero ODL');
  }
  
  // Verifica formato alfanumerico
  if (!/^[A-Z0-9]+$/i.test(odlNumber)) {
    issues.push('Numero ODL deve contenere solo lettere e numeri');
    suggestions.push('Rimuovere caratteri speciali e spazi');
  }
  
  // Verifica presenza di almeno una lettera e un numero
  if (!/[A-Z]/i.test(odlNumber)) {
    issues.push('Numero ODL deve contenere almeno una lettera');
    suggestions.push('Aggiungere lettere identificative');
  }
  
  if (!/\d/.test(odlNumber)) {
    issues.push('Numero ODL deve contenere almeno un numero');
    suggestions.push('Aggiungere numerazione sequenziale');
  }
  
  // Verifica pattern comune (lettere seguite da numeri)
  if (!/^[A-Z]+\d+$/i.test(odlNumber)) {
    suggestions.push('Formato consigliato: lettere seguite da numeri (es: ABC123)');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

// Endpoint POST per validazione batch (opzionale)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { odlNumbers } = body;

    if (!Array.isArray(odlNumbers)) {
      return NextResponse.json({
        error: 'Formato non valido: richiesto array di numeri ODL'
      }, { status: 400 });
    }

    // Validazione batch
    const results = await Promise.all(
      odlNumbers.map(async (odlNumber: string) => {
        const existing = await prisma.oDL.findFirst({
          where: { odlNumber: odlNumber },
          select: { id: true, odlNumber: true }
        });
        
        return {
          odlNumber,
          isUnique: !existing,
          validation: validateOdlNumberFormat(odlNumber)
        };
      })
    );

    return NextResponse.json({
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore nella validazione batch ODL:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}