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
    const filteredOdls = odls.filter(odl => {
      return odl.part.autoclaveConfig !== null;
    });

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
        const dimensions = tool ? { length: tool.base, width: tool.base, height: tool.height } : null;
        const estimatedVolume = tool ? tool.base * tool.base * tool.height * odl.quantity : null;
        
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
      filteredCount: filteredOdls.length
    });

    return NextResponse.json({
      success: true,
      odls: filteredOdls.map(odl => {
        const tool = odl.part.partTools[0]?.tool;
        const dimensions = tool ? { length: tool.base, width: tool.base, height: tool.height } : null;
        const estimatedVolume = tool ? tool.base * tool.base * tool.height * odl.quantity : null;
        
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
        };
      }),
      groupedByCycle,
      cycleNames,
      totalCount: filteredOdls.length,
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