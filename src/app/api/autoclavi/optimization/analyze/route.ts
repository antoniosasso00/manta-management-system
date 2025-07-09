import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { ODLService } from '@/domains/core/services/ODLService';
import { AutoclaveService } from '@/domains/autoclave/services/autoclave-service';
import { prisma } from '@/lib/prisma';
import { 
  OptimizationService,
  convertODLToOptimizationData,
  convertAutoclaveToOptimizationData
} from '@/services/optimization-service';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { odlIds, autoclaveIds, constraints } = body;

    // Recupera dati dal database
    const [odls, autoclaves] = await Promise.all([
      prisma.oDL.findMany({
        where: { id: { in: odlIds } },
        include: {
          part: {
            include: {
              partTools: {
                include: {
                  tool: true
                }
              },
              autoclaveConfig: {
                include: {
                  curingCycle: true
                }
              }
            }
          }
        }
      }),
      prisma.autoclave.findMany({
        where: { id: { in: autoclaveIds } }
      })
    ]);

    // Filtra solo ODL nel reparto autoclavi
    const validOdls = odls.filter(odl => 
      odl.status === 'IN_AUTOCLAVE' || odl.status === 'CLEANROOM_COMPLETED'
    );

    if (validOdls.length === 0) {
      return NextResponse.json({ 
        error: `Nessun ODL disponibile per ottimizzazione. Trovati ${odls.length} ODL totali, ma nessuno con status IN_AUTOCLAVE o CLEANROOM_COMPLETED.` 
      }, { status: 400 });
    }

    if (autoclaves.length === 0) {
      return NextResponse.json({ 
        error: 'Nessuna autoclave trovata' 
      }, { status: 400 });
    }

    // Converti per microservizio
    let optimizationData;
    try {
      optimizationData = {
        odls: validOdls.map(convertODLToOptimizationData),
        autoclaves: autoclaves.map(convertAutoclaveToOptimizationData),
        constraints: constraints || {
          min_border_distance: 50,
          min_tool_distance: 30,
          allow_rotation: true
        }
      };
    } catch (conversionError) {
      console.error('Errore conversione dati:', conversionError);
      return NextResponse.json({ 
        error: `Errore conversione dati: ${conversionError instanceof Error ? conversionError.message : 'Errore sconosciuto'}` 
      }, { status: 400 });
    }

    // Chiama microservizio
    const result = await OptimizationService.analyzeCycles(optimizationData);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Errore analisi ottimizzazione:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'analisi di ottimizzazione' },
      { status: 500 }
    );
  }
}