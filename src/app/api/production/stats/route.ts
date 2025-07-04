import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ODL_STATUS } from '@/utils/constants';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Stats ODL totali
    const totalODL = await prisma.oDL.count();

    // ODL in lavorazione (stati intermedi - escluso MOTORI che è autonomo)
    const inProgress = await prisma.oDL.count({
      where: {
        status: {
          in: [
            ODL_STATUS.IN_CLEANROOM,
            ODL_STATUS.IN_AUTOCLAVE, 
            ODL_STATUS.IN_NDI,
            ODL_STATUS.IN_CONTROLLO_NUMERICO,
            ODL_STATUS.IN_MONTAGGIO,
            ODL_STATUS.IN_VERNICIATURA,
            ODL_STATUS.IN_CONTROLLO_QUALITA
          ]
        }
      }
    });

    // ODL completati
    const completed = await prisma.oDL.count({
      where: {
        status: ODL_STATUS.COMPLETED
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