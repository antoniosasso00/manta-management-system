import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { ODLService } from '@/domains/core/services/ODLService';
import { AutoclaveService } from '@/domains/autoclave/services/autoclave-service';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
import { 
  OptimizationService,
  convertODLToOptimizationData,
  convertAutoclaveToOptimizationData
} from '@/services/optimization-service';

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

    // Filtra ODL che hanno configurazione autoclave
    const validOdls = odls.filter(odl => odl.part.autoclaveConfig != null);
    const excludedOdls = odls.filter(odl => odl.part.autoclaveConfig == null);

    if (validOdls.length === 0) {
      const missingConfigurations = excludedOdls.map(odl => ({
        odlId: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        partId: odl.part.id,
        reason: 'Configurazione autoclave mancante'
      }));

      return NextResponse.json({ 
        error: 'Nessun ODL disponibile per analisi supporti rialzati',
        details: {
          total_odls: odls.length,
          excluded_by_config: excludedOdls.length,
          missing_configurations: missingConfigurations
        }
      }, { status: 400 });
    }

    // Converti per microservizio
    const optimizationData = {
      odls: validOdls.map(convertODLToOptimizationData),
      autoclaves: autoclaves.map(convertAutoclaveToOptimizationData),
      constraints: constraints || {
        min_border_distance: 50,
        min_tool_distance: 30,
        allow_rotation: true
      }
    };

    // Chiama microservizio per analisi supporti rialzati
    const result = await OptimizationService.analyzeElevatedTools(optimizationData);

    // Aggiungi warning se ci sono parti escluse
    const response = {
      ...result,
      warnings: excludedOdls.length > 0 ? {
        excluded_odls_count: excludedOdls.length,
        missing_configurations: excludedOdls.map(odl => ({
          odlId: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          partId: odl.part.id,
          reason: 'Configurazione autoclave mancante'
        })),
        message: `${excludedOdls.length} ODL esclusi per configurazione autoclave mancante`
      } : null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Errore analisi supporti rialzati:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'analisi dei supporti rialzati' },
      { status: 500 }
    );
  }
}