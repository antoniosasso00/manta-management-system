import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { DepartmentType, ODLStatus, UserRole } from '@prisma/client';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Calcola KPI real-time dal database
    const [
      odlInProgress,
      odlCompleted,
      todayProductionEvents,
      activeAlerts,
      departmentStats,
      recentActivity
    ] = await Promise.all([
      // ODL in lavorazione
      prisma.oDL.count({
        where: {
          status: {
            in: [ODLStatus.IN_CLEANROOM, ODLStatus.IN_AUTOCLAVE, ODLStatus.IN_NDI, ODLStatus.IN_HONEYCOMB, ODLStatus.IN_CONTROLLO_NUMERICO, ODLStatus.IN_MONTAGGIO, ODLStatus.IN_VERNICIATURA, ODLStatus.IN_MOTORI, ODLStatus.IN_CONTROLLO_QUALITA]
          }
        }
      }),
      
      // ODL completati questo mese
      prisma.oDL.count({
        where: {
          status: ODLStatus.COMPLETED,
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Eventi di produzione oggi
      prisma.productionEvent.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Allarmi attivi (ODL in ritardo > 7 giorni)
      prisma.oDL.count({
        where: {
          status: {
            not: ODLStatus.COMPLETED
          },
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Statistiche per reparto
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          _count: {
            select: {
              events: {
                where: {
                  timestamp: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                  }
                }
              }
            }
          }
        }
      }),
      
      // Attività recente (ultimi 10 eventi)
      prisma.productionEvent.findMany({
        take: 10,
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
          user: {
            select: {
              name: true,
              email: true
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

    // Calcola tempo medio per reparto (approssimativo)
    const avgTimeCalculation = await prisma.productionEvent.groupBy({
      by: ['departmentId'],
      _avg: {
        duration: true
      },
      where: {
        duration: {
          not: null
        },
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Ultimi 30 giorni
        }
      }
    });

    // Calcola la media ponderata di tutte le durate (convertendo da millisecondi a ore)
    const totalDuration = avgTimeCalculation.reduce((sum, dept) => sum + (dept._avg.duration || 0), 0);
    const avgTimePerDepartment = avgTimeCalculation.length > 0 
      ? (totalDuration / avgTimeCalculation.length) / (1000 * 60 * 60) // Converti ms -> ore
      : 0;

    // Calcola tasso di completamento (completati vs totali questo mese)
    const monthlyTotal = await prisma.oDL.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const completionRate = monthlyTotal > 0 ? Math.round((odlCompleted / monthlyTotal) * 100) : 0;

    // Notifiche prioritarie
    const priorityNotifications = await prisma.oDL.findMany({
      where: {
        OR: [
          {
            priority: 'URGENT',
            status: { not: ODLStatus.COMPLETED }
          },
          {
            status: { not: ODLStatus.COMPLETED },
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      take: 5,
      select: {
        id: true,
        odlNumber: true,
        priority: true,
        status: true,
        createdAt: true,
        part: {
          select: {
            partNumber: true,
            description: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const kpiData = {
      metrics: {
        odlInProgress,
        odlCompleted,
        completionRate,
        avgTimePerDepartment: Math.round(avgTimePerDepartment * 10) / 10, // 1 decimale per le ore
        activeAlerts,
        todayProduction: todayProductionEvents
      },
      departmentStats: departmentStats.map(dept => ({
        id: dept.id,
        name: dept.name,
        type: dept.type,
        todayEvents: dept._count.events,
        status: dept._count.events > 0 ? 'ACTIVE' : 'IDLE'
      })),
      recentActivity: recentActivity.map(event => ({
        id: event.id,
        type: event.eventType,
        timestamp: event.timestamp,
        description: event.notes,
        odl: event.odl ? {
          odlNumber: event.odl.odlNumber,
          partNumber: event.odl.part.partNumber,
          description: event.odl.part.description
        } : null,
        user: event.user ? {
          name: event.user.name,
          email: event.user.email
        } : null,
        department: {
          name: event.department.name,
          type: event.department.type
        }
      })),
      notifications: priorityNotifications.map(odl => ({
        id: odl.id,
        type: odl.priority === 'URGENT' ? 'CRITICAL_PRIORITY' : 'DELAYED_ODL',
        title: odl.priority === 'URGENT' 
          ? `ODL Critico: ${odl.odlNumber}`
          : `ODL in Ritardo: ${odl.odlNumber}`,
        message: odl.priority === 'URGENT'
          ? `${odl.part.partNumber} - ${odl.part.description}`
          : `Creato il ${odl.createdAt.toLocaleDateString('it-IT')} - Status: ${odl.status}`,
        priority: odl.priority,
        createdAt: odl.createdAt,
        link: `/production/odl/${odl.id}`
      })),
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('Errore nel calcolo KPI dashboard:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}