import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Costruisci filtri
    const where: any = {
      status: 'CLEANROOM_COMPLETED', // Solo ODL completati in Clean Room
    };

    if (search) {
      where.OR = [
        { odlNumber: { contains: search, mode: 'insensitive' } },
        { part: { partNumber: { contains: search, mode: 'insensitive' } } },
        { part: { description: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const odls = await prisma.oDL.findMany({
      where,
      include: {
        part: {
          include: {
            defaultCuringCycle: true,
          },
        },
        curingCycle: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    // Filtra per compatibilità ciclo di cura se specificato
    let filteredOdls = odls;
    if (curingCycleId) {
      filteredOdls = odls.filter(odl => {
        const odlCycleId = odl.curingCycleId || odl.part.defaultCuringCycleId;
        return odlCycleId === curingCycleId;
      });
    }

    // Raggruppa per ciclo di cura per facilitare la selezione
    const groupedByCycle: Record<string, any[]> = {};
    const cycleNames: Record<string, string> = {};

    for (const odl of filteredOdls) {
      const cycleId = odl.curingCycleId || odl.part.defaultCuringCycleId;
      const cycle = odl.curingCycle || odl.part.defaultCuringCycle;
      
      if (cycleId && cycle) {
        if (!groupedByCycle[cycleId]) {
          groupedByCycle[cycleId] = [];
          cycleNames[cycleId] = cycle.name;
        }
        groupedByCycle[cycleId].push({
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          partDescription: odl.part.description,
          quantity: odl.quantity,
          priority: odl.priority,
          createdAt: odl.createdAt,
          dimensions: {
            length: odl.length || odl.part.standardLength,
            width: odl.width || odl.part.standardWidth,
            height: odl.height || odl.part.standardHeight,
          },
          estimatedVolume: (odl.length || odl.part.standardLength || 0) * 
                          (odl.width || odl.part.standardWidth || 0) * 
                          (odl.height || odl.part.standardHeight || 0),
        });
      }
    }

    return NextResponse.json({
      success: true,
      odls: filteredOdls.map(odl => ({
        id: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        partDescription: odl.part.description,
        quantity: odl.quantity,
        priority: odl.priority,
        createdAt: odl.createdAt,
        curingCycleId: odl.curingCycleId || odl.part.defaultCuringCycleId,
        curingCycleName: (odl.curingCycle || odl.part.defaultCuringCycle)?.name,
        dimensions: {
          length: odl.length || odl.part.standardLength,
          width: odl.width || odl.part.standardWidth,
          height: odl.height || odl.part.standardHeight,
        },
        estimatedVolume: (odl.length || odl.part.standardLength || 0) * 
                        (odl.width || odl.part.standardWidth || 0) * 
                        (odl.height || odl.part.standardHeight || 0),
      })),
      groupedByCycle,
      cycleNames,
      totalCount: filteredOdls.length,
    });
  } catch (error) {
    console.error('Errore recupero ODL disponibili:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}