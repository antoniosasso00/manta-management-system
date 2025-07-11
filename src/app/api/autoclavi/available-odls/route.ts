import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/autoclavi/available-odls - Lista ODL disponibili per batch
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const curingCycleId = searchParams.get('curingCycleId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Costruisci filtri con database-level filtering
    const where: any = {
      status: 'CLEANROOM_COMPLETED', // Solo ODL completati in Clean Room
    };

    // Filtra per ciclo di cura a livello database
    if (curingCycleId) {
      where.part = {
        autoclaveConfig: {
          curingCycleId: curingCycleId
        }
      };
    }

    // Aggiungi filtro di ricerca se presente
    if (search) {
      if (where.part) {
        // Se già esiste il filtro part, aggiungi OR per la ricerca
        where.AND = [
          { part: where.part },
          {
            OR: [
              { odlNumber: { contains: search, mode: 'insensitive' } },
              { part: { partNumber: { contains: search, mode: 'insensitive' } } },
              { part: { description: { contains: search, mode: 'insensitive' } } },
            ]
          }
        ];
        delete where.part;
      } else {
        where.OR = [
          { odlNumber: { contains: search, mode: 'insensitive' } },
          { part: { partNumber: { contains: search, mode: 'insensitive' } } },
          { part: { description: { contains: search, mode: 'insensitive' } } },
        ];
      }
    }

    const odls = await prisma.oDL.findMany({
      where,
      include: {
        part: {
          include: {
            autoclaveConfig: {
              include: {
                curingCycle: true
              }
            },
            partTools: {
              include: {
                tool: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    // Filtra ulteriormente per assicurarsi che abbiano configurazione autoclave
    // Se non è specificato un ciclo di cura, mostra tutti gli ODL
    const filteredOdls = curingCycleId ? 
      odls.filter(odl => odl.part.autoclaveConfig !== null) : 
      odls;

    // Raggruppa per ciclo di cura per facilitare la selezione
    const groupedByCycle: Record<string, any[]> = {};
    const cycleNames: Record<string, string> = {};

    for (const odl of filteredOdls) {
      const cycleId = odl.part.autoclaveConfig?.curingCycleId;
      const cycle = odl.part.autoclaveConfig?.curingCycle;
      
      if (cycleId && cycle) {
        if (!groupedByCycle[cycleId]) {
          groupedByCycle[cycleId] = [];
          cycleNames[cycleId] = cycle?.name || 'Unknown';
        }
        const tool = odl.part.partTools[0]?.tool;
        // Usa dimensioni da tool se disponibili, altrimenti usa dimensioni standard
        const dimensions = tool ? 
          { length: tool.base, width: tool.base, height: tool.height } : 
          { length: 100, width: 100, height: 50 }; // Dimensioni standard per compositi
        const estimatedVolume = tool ? 
          tool.base * tool.base * tool.height * odl.quantity : 
          100 * 100 * 50 * odl.quantity; // Volume standard
        
        groupedByCycle[cycleId].push({
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          partDescription: odl.part.description,
          quantity: odl.quantity,
          priority: odl.priority,
          createdAt: odl.createdAt,
          dimensions,
          estimatedVolume,
        });
      }
    }

    // Debug logging  
    console.log('Available ODLs API called with params:', {
      curingCycleId,
      search,
      limit,
      totalFound: odls.length,
      filteredCount: filteredOdls.length,
      firstOdlDebug: odls[0] ? {
        id: odls[0].id,
        odlNumber: odls[0].odlNumber,
        partNumber: odls[0].part.partNumber,
        hasAutoclaveConfig: !!odls[0].part.autoclaveConfig,
        configCycleId: odls[0].part.autoclaveConfig?.curingCycleId,
        hasPartTools: odls[0].part.partTools.length > 0,
        status: odls[0].status
      } : null
    });

    // Calcola statistiche di configurazione per warnings
    const configStats = {
      totalOdls: odls.length,
      withAutoclaveConfig: odls.filter(odl => odl.part.autoclaveConfig !== null).length,
      withPartTools: odls.filter(odl => odl.part.partTools.length > 0).length,
      withMatchingCycle: curingCycleId ? odls.filter(odl => 
        odl.part.autoclaveConfig?.curingCycleId === curingCycleId
      ).length : 0,
    };

    return NextResponse.json({
      success: true,
      odls: filteredOdls.map(odl => {
        const tool = odl.part.partTools[0]?.tool;
        // Usa dimensioni da tool se disponibili, altrimenti usa dimensioni standard
        const dimensions = tool ? 
          { length: tool.base, width: tool.base, height: tool.height } : 
          { length: 100, width: 100, height: 50 }; // Dimensioni standard per compositi
        const estimatedVolume = tool ? 
          tool.base * tool.base * tool.height * odl.quantity : 
          100 * 100 * 50 * odl.quantity; // Volume standard
        
        return {
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          partDescription: odl.part.description,
          quantity: odl.quantity,
          priority: odl.priority,
          createdAt: odl.createdAt,
          curingCycleId: odl.part.autoclaveConfig?.curingCycleId,
          curingCycleName: odl.part.autoclaveConfig?.curingCycle?.name,
          dimensions,
          estimatedVolume,
          hasAutoclaveConfig: !!odl.part.autoclaveConfig,
          hasPartTools: odl.part.partTools.length > 0,
        };
      }),
      groupedByCycle,
      cycleNames,
      totalCount: filteredOdls.length,
      configStats,
      warnings: {
        missingAutoclaveConfig: configStats.totalOdls - configStats.withAutoclaveConfig,
        missingPartTools: configStats.totalOdls - configStats.withPartTools,
        noMatchingCycle: curingCycleId ? configStats.totalOdls - configStats.withMatchingCycle : 0,
      },
      debug: {
        queryParams: { curingCycleId, search, limit },
        totalQueried: odls.length,
        totalFiltered: filteredOdls.length,
        filterApplied: !!curingCycleId
      }
    });
  } catch (error) {
    console.error('Errore recupero ODL disponibili:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}