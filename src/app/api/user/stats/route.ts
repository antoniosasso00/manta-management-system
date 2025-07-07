import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { ODLStatus, EventType } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Periodo di riferimento
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Calcola statistiche utente
    const [
      odlCreated,
      odlCompleted,
      productionEvents,
      weeklyActivity,
      monthlyActivity,
      yearlyActivity,
      departmentActivity,
      averageTimePerOperation,
      recentActivity
    ] = await Promise.all([
      // ODL gestiti dall'utente (con eventi)
      prisma.oDL.count({
        where: {
          events: {
            some: {
              userId: userId
            }
          }
        }
      }),
      
      // ODL completati attraverso eventi utente
      prisma.productionEvent.count({
        where: {
          userId: userId,
          eventType: EventType.EXIT,
          odl: {
            status: ODLStatus.COMPLETED
          }
        }
      }),
      
      // Eventi di produzione totali
      prisma.productionEvent.count({
        where: {
          userId: userId
        }
      }),
      
      // Attività settimanale
      prisma.productionEvent.count({
        where: {
          userId: userId,
          timestamp: {
            gte: startOfWeek
          }
        }
      }),
      
      // Attività mensile
      prisma.productionEvent.count({
        where: {
          userId: userId,
          timestamp: {
            gte: startOfMonth
          }
        }
      }),
      
      // Attività annuale
      prisma.productionEvent.count({
        where: {
          userId: userId,
          timestamp: {
            gte: startOfYear
          }
        }
      }),
      
      // Attività per reparto
      prisma.productionEvent.groupBy({
        by: ['departmentId'],
        _count: {
          id: true
        },
        where: {
          userId: userId
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),
      
      // Tempo medio per operazione (dove disponibile)
      prisma.productionEvent.aggregate({
        _avg: {
          duration: true
        },
        where: {
          userId: userId,
          duration: {
            not: null
          }
        }
      }),
      
      // Attività recente (ultimi 15 eventi)
      prisma.productionEvent.findMany({
        where: {
          userId: userId
        },
        take: 15,
        orderBy: { timestamp: 'desc' },
        include: {
          odl: {
            select: {
              odlNumber: true,
              part: {
                select: {
                  partNumber: true,
                  description: true
                }
              }
            }
          },
          department: {
            select: {
              name: true,
              type: true
            }
          }
        }
      })
    ]);

    // Recupera nomi reparti per statistiche
    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: departmentActivity.map(dept => dept.departmentId)
        }
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    });

    // Calcola ore lavorate totali (stima basata su eventi)
    const workingHoursEstimate = productionEvents * 0.5; // 30 minuti per evento medio

    // Calcola trend attività (confronto con periodo precedente)
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const previousMonthActivity = await prisma.productionEvent.count({
      where: {
        userId: userId,
        timestamp: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      }
    });

    const activityTrend = previousMonthActivity > 0 
      ? Math.round(((monthlyActivity - previousMonthActivity) / previousMonthActivity) * 100)
      : 0;

    // Calcola performance score (algoritmo semplificato)
    const performanceScore = Math.min(100, Math.round(
      (odlCompleted * 10) + 
      (productionEvents * 2) + 
      (monthlyActivity * 5) + 
      (weeklyActivity * 10)
    ));

    // Statistiche giornaliere ultime 7 giorni
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayEvents = await prisma.productionEvent.count({
        where: {
          userId: userId,
          timestamp: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        events: dayEvents,
        dayName: dayStart.toLocaleDateString('it-IT', { weekday: 'short' })
      });
    }

    const userStats = {
      summary: {
        odlCreated,
        odlCompleted,
        totalEvents: productionEvents,
        totalWorkingHours: Math.round(workingHoursEstimate * 100) / 100,
        performanceScore,
        activityTrend // Percentuale di cambiamento rispetto al mese precedente
      },
      activity: {
        today: dailyStats[6]?.events || 0,
        thisWeek: weeklyActivity,
        thisMonth: monthlyActivity,
        thisYear: yearlyActivity,
        averageTimePerOperation: Math.round((averageTimePerOperation._avg.duration || 0) * 100) / 100,
        dailyStats
      },
      departments: departmentActivity.map(dept => {
        const departmentInfo = departments.find(d => d.id === dept.departmentId);
        return {
          id: dept.departmentId,
          name: departmentInfo?.name || 'Reparto Sconosciuto',
          type: departmentInfo?.type || 'UNKNOWN',
          eventCount: dept._count.id,
          percentage: Math.round((dept._count.id / productionEvents) * 100)
        };
      }),
      recentActivity: recentActivity.map(event => ({
        id: event.id,
        type: event.eventType,
        timestamp: event.timestamp,
        description: event.notes || 'Nessuna descrizione',
        duration: event.duration,
        odl: event.odl ? {
          progressivo: event.odl.odlNumber,
          partNumber: event.odl.part.partNumber,
          description: event.odl.part.description
        } : null,
        department: {
          name: event.department.name,
          type: event.department.type
        }
      })),
      badges: [
        ...(odlCreated > 50 ? [{ name: 'Creatore Esperto', description: 'Oltre 50 ODL creati', icon: '🏆' }] : []),
        ...(odlCompleted > 100 ? [{ name: 'Completatore Master', description: 'Oltre 100 ODL completati', icon: '🎯' }] : []),
        ...(productionEvents > 500 ? [{ name: 'Operatore Veterano', description: 'Oltre 500 eventi', icon: '⚡' }] : []),
        ...(performanceScore > 80 ? [{ name: 'Performance Eccellente', description: 'Score sopra 80', icon: '🌟' }] : [])
      ],
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Errore nel calcolo statistiche utente:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}