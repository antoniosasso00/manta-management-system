import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkUniqueSchema = z.object({
  progressivo: z.string().min(1, 'Progressivo ODL richiesto'),
  excludeId: z.string().optional() // Per escludere ODL corrente durante modifica
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const progressivo = searchParams.get('progressivo');
    const excludeId = searchParams.get('excludeId');

    // Validazione parametri
    const validation = checkUniqueSchema.safeParse({
      progressivo,
      excludeId
    });

    if (!validation.success) {
      return NextResponse.json({
        error: 'Parametri non validi',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { progressivo: validProgressivo, excludeId: validExcludeId } = validation.data;

    // Costruisci query per controllo unicità
    const whereConditions: any = {
      progressivo: validProgressivo
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
        progressivo: true,
        status: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
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
        progressivo: existingODL.progressivo,
        status: existingODL.status,
        createdAt: existingODL.createdAt,
        createdBy: existingODL.createdBy,
        part: existingODL.part
      }
    } : null;

    // Suggerimenti per progressivo alternativo
    const suggestions = [];
    if (!isUnique) {
      // Genera suggerimenti basati sul progressivo richiesto
      const baseProgressivo = validProgressivo.replace(/\d+$/, ''); // Rimuovi numeri finali
      const matches = validProgressivo.match(/\d+$/); // Trova numeri finali
      const currentNumber = matches ? parseInt(matches[0]) : 1;
      
      for (let i = 1; i <= 3; i++) {
        const suggestedProgressivo = `${baseProgressivo}${currentNumber + i}`;
        
        // Verifica se il suggerimento è disponibile
        const suggestionExists = await prisma.oDL.findFirst({
          where: { progressivo: suggestedProgressivo },
          select: { id: true }
        });
        
        if (!suggestionExists) {
          suggestions.push(suggestedProgressivo);
        }
      }
    }

    // Statistiche aggiuntive per debug/analytics
    const stats = await prisma.oDL.aggregate({
      _count: { id: true },
      where: {
        progressivo: {
          startsWith: validProgressivo.substring(0, 3) // Primi 3 caratteri
        }
      }
    });

    const response = {
      isUnique,
      progressivo: validProgressivo,
      ...(conflictInfo && { conflict: conflictInfo }),
      ...(suggestions.length > 0 && { suggestions }),
      validation: {
        format: validateProgressivoFormat(validProgressivo),
        length: validProgressivo.length,
        similarCount: stats._count.id
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

// Funzione helper per validare formato progressivo
function validateProgressivoFormat(progressivo: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Verifica lunghezza (formato tipico 6-12 caratteri)
  if (progressivo.length < 6) {
    issues.push('Progressivo troppo corto (minimo 6 caratteri)');
    suggestions.push('Aggiungere caratteri o numeri per raggiungere la lunghezza minima');
  }
  
  if (progressivo.length > 12) {
    issues.push('Progressivo troppo lungo (massimo 12 caratteri)');
    suggestions.push('Ridurre la lunghezza del progressivo');
  }
  
  // Verifica formato alfanumerico
  if (!/^[A-Z0-9]+$/i.test(progressivo)) {
    issues.push('Progressivo deve contenere solo lettere e numeri');
    suggestions.push('Rimuovere caratteri speciali e spazi');
  }
  
  // Verifica presenza di almeno una lettera e un numero
  if (!/[A-Z]/i.test(progressivo)) {
    issues.push('Progressivo deve contenere almeno una lettera');
    suggestions.push('Aggiungere lettere identificative');
  }
  
  if (!/\d/.test(progressivo)) {
    issues.push('Progressivo deve contenere almeno un numero');
    suggestions.push('Aggiungere numerazione sequenziale');
  }
  
  // Verifica pattern comune (lettere seguite da numeri)
  if (!/^[A-Z]+\d+$/i.test(progressivo)) {
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { progressivos } = body;

    if (!Array.isArray(progressivos)) {
      return NextResponse.json({
        error: 'Formato non valido: richiesto array di progressivi'
      }, { status: 400 });
    }

    // Validazione batch
    const results = await Promise.all(
      progressivos.map(async (progressivo: string) => {
        const existing = await prisma.oDL.findFirst({
          where: { progressivo },
          select: { id: true, progressivo: true }
        });
        
        return {
          progressivo,
          isUnique: !existing,
          validation: validateProgressivoFormat(progressivo)
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