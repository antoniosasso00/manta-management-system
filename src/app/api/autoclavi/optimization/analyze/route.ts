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
    const statusValidOdls = odls.filter(odl => 
      odl.status === 'IN_AUTOCLAVE' || odl.status === 'CLEANROOM_COMPLETED'
    );

    // Separa ODL validi da quelli senza configurazione autoclave
    const validOdls = statusValidOdls.filter(odl => 
      odl.part.autoclaveConfig != null
    );
    
    const excludedOdls = statusValidOdls.filter(odl => 
      odl.part.autoclaveConfig == null
    );

    const excludedByStatus = odls.length - statusValidOdls.length;
    const excludedByConfig = excludedOdls.length;

    // Prepara informazioni dettagliate sulle parti escluse
    const missingConfigurations = excludedOdls.map(odl => ({
      odlId: odl.id,
      odlNumber: odl.odlNumber,
      partNumber: odl.part.partNumber,
      partId: odl.part.id,
      description: odl.part.description,
      reason: 'Configurazione autoclave mancante'
    }));

    if (validOdls.length === 0) {
      return NextResponse.json({ 
        error: 'Nessun ODL disponibile per ottimizzazione',
        details: {
          total_odls: odls.length,
          excluded_by_status: excludedByStatus,
          excluded_by_config: excludedByConfig,
          missing_configurations: missingConfigurations,
          available_for_optimization: 0
        }
      }, { status: 400 });
    }

    // Log warning per parti escluse
    if (excludedByConfig > 0) {
      console.warn(`⚠️  ${excludedByConfig} ODL esclusi dall'ottimizzazione per mancanza configurazione autoclave:`, 
        missingConfigurations.map(item => item.partNumber)
      );
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

    // Aggiungi informazioni sui warning se ci sono parti escluse
    const response = {
      ...result,
      warnings: excludedByConfig > 0 ? {
        excluded_odls_count: excludedByConfig,
        missing_configurations: missingConfigurations,
        message: `${excludedByConfig} ODL esclusi per configurazione autoclave mancante`
      } : null,
      optimization_summary: {
        total_input_odls: odls.length,
        processed_odls: validOdls.length,
        excluded_by_status: excludedByStatus,
        excluded_by_config: excludedByConfig
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Errore analisi ottimizzazione:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'analisi di ottimizzazione' },
      { status: 500 }
    );
  }
}