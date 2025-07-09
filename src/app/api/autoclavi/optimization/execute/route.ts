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
    const { odlIds, autoclaveIds, selectedCycles, elevatedTools, constraints } = body;

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
      return NextResponse.json({ 
        error: 'Nessun ODL disponibile per esecuzione ottimizzazione',
        details: {
          total_odls: odls.length,
          excluded_by_config: excludedOdls.length,
          missing_configurations: excludedOdls.map(odl => ({
            odlId: odl.id,
            odlNumber: odl.odlNumber,
            partNumber: odl.part.partNumber,
            partId: odl.part.id,
            reason: 'Configurazione autoclave mancante'
          }))
        }
      }, { status: 400 });
    }

    // Converti per microservizio
    const optimizationData = {
      odls: validOdls.map(convertODLToOptimizationData),
      autoclaves: autoclaves.map(convertAutoclaveToOptimizationData),
      selected_cycles: selectedCycles,
      elevated_tools: elevatedTools || [],
      constraints: constraints || {
        min_border_distance: 50,
        min_tool_distance: 30,
        allow_rotation: true
      }
    };

    // Esegui ottimizzazione
    const result = await OptimizationService.executeOptimization(optimizationData);

    // Salva risultati in sessione per conferma successiva
    // In produzione usare Redis o database temporaneo
    const optimizationSession = {
      id: result.optimization_id,
      result,
      odls,
      autoclaves,
      createdAt: new Date()
    };

    // Per ora salviamo in memoria (sostituire con Redis in produzione)
    (global as any).optimizationSessions = (global as any).optimizationSessions || {};
    (global as any).optimizationSessions[result.optimization_id] = optimizationSession;

    return NextResponse.json(result);

  } catch (error) {
    console.error('Errore esecuzione ottimizzazione:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'esecuzione dell\'ottimizzazione' },
      { status: 500 }
    );
  }
}