import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Data di oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // KPI: ODL oggi assegnati all'utente
    const odlToday = await prisma.oDL.count({
      where: {
        events: {
          some: {
            userId: userId,
            timestamp: {
              gte: today,
              lt: tomorrow
            }
          }
        }
      }
    });

    // KPI: ODL completati oggi dall'utente
    const odlCompleted = await prisma.oDL.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today,
          lt: tomorrow
        },
        events: {
          some: {
            userId: userId,
            eventType: 'EXIT'
          }
        }
      }
    });

    // KPI: Tempo medio di lavorazione (ultimi 30 giorni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedEvents = await prisma.productionEvent.findMany({
      where: {
        userId: userId,
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

    const averageTime = completedEvents.length > 0
      ? Math.round(
          completedEvents.reduce((sum, event) => sum + (event.duration || 0), 0) 
          / completedEvents.length / 60000 // Converti da ms a minuti
        )
      : 0;

    // KPI: Efficienza (ODL completati nei tempi / ODL totali)
    const totalODLLastWeek = await prisma.oDL.count({
      where: {
        events: {
          some: {
            userId: userId,
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    const completedOnTimeLastWeek = await prisma.oDL.count({
      where: {
        status: 'COMPLETED',
        events: {
          some: {
            userId: userId,
            eventType: 'EXIT',
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            duration: {
              lt: 4 * 60 * 60 * 1000 // Meno di 4 ore considerato "nei tempi"
            }
          }
        }
      }
    });

    const efficiency = totalODLLastWeek > 0 
      ? Math.round((completedOnTimeLastWeek / totalODLLastWeek) * 100)
      : 0;

    return NextResponse.json({
      odlToday,
      odlCompleted,
      averageTime,
      efficiency: Math.min(efficiency, 100) // Cap al 100%
    });

  } catch (error) {
    console.error('KPI API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}