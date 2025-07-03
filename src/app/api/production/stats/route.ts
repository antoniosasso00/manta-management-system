import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Stats ODL totali
    const totalODL = await prisma.oDL.count();

    // ODL in lavorazione (stati intermedi)
    const inProgress = await prisma.oDL.count({
      where: {
        status: {
          in: [
            'IN_CLEANROOM',
            'IN_AUTOCLAVE', 
            'IN_NDI',
            'IN_RIFILATURA'
          ]
        }
      }
    });

    // ODL completati
    const completed = await prisma.oDL.count({
      where: {
        status: 'COMPLETED'
      }
    });

    // Tempo medio di ciclo (ultimi 30 giorni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedEvents = await prisma.productionEvent.findMany({
      where: {
        eventType: 'EXIT',
        timestamp: {
          gte: thirtyDaysAgo
        },
        duration: {
          not: null
        }
      },
      select: {
        duration: true
      }
    });

    const averageCycleTime = completedEvents.length > 0
      ? Math.round(
          completedEvents.reduce((sum, event) => sum + (event.duration || 0), 0) 
          / completedEvents.length / 60000 // Converti da ms a minuti
        )
      : 0;

    return NextResponse.json({
      totalODL,
      inProgress,
      completed,
      averageCycleTime
    });

  } catch (error) {
    console.error('Production stats API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}