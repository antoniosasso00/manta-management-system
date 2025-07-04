import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Verifica ruolo admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parametri di filtro
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || '';
    const eventType = searchParams.get('eventType') || '';
    const level = searchParams.get('level') || '';
    const department = searchParams.get('department') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Costruisci filtri Where
    const whereConditions: any = {};

    // Filtro ricerca testuale
    if (search) {
      whereConditions.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { metadata: { path: '$.details', string_contains: search } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filtro utente
    if (userId) {
      whereConditions.userId = userId;
    }

    // Filtro tipo evento
    if (eventType) {
      whereConditions.eventType = eventType;
    }

    // Filtro livello
    if (level) {
      whereConditions.level = level;
    }

    // Filtro reparto
    if (department) {
      whereConditions.departmentId = department;
    }

    // Filtro data
    if (dateFrom || dateTo) {
      whereConditions.timestamp = {};
      if (dateFrom) {
        whereConditions.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereConditions.timestamp.lte = new Date(dateTo);
      }
    }

    // Calcola offset per paginazione
    const offset = (page - 1) * limit;

    // Esegui query con filtri
    const [events, totalCount] = await Promise.all([
      prisma.productionEvent.findMany({
        where: whereConditions,
        take: limit,
        skip: offset,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          odl: {
            select: {
              id: true,
              progressivo: true,
              part: {
                select: {
                  partNumber: true,
                  description: true
                }
              }
            }
          }
        }
      }),
      prisma.productionEvent.count({
        where: whereConditions
      })
    ]);

    // Trasforma eventi in formato audit
    const auditEvents = events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      category: getCategoryFromEventType(event.eventType),
      level: getLevelFromEventType(event.eventType),
      title: getEventTitle(event),
      description: event.description,
      user: event.user ? {
        id: event.user.id,
        name: event.user.name,
        email: event.user.email,
        role: event.user.role
      } : null,
      department: event.department ? {
        id: event.department.id,
        name: event.department.name,
        type: event.department.type
      } : null,
      odl: event.odl ? {
        id: event.odl.id,
        progressivo: event.odl.progressivo,
        partNumber: event.odl.part.partNumber,
        description: event.odl.part.description
      } : null,
      metadata: {
        duration: event.duration,
        details: event.description,
        source: 'PRODUCTION_EVENT'
      }
    }));

    // Aggiungi eventi di autenticazione da altre tabelle se necessario
    if (!eventType || eventType === 'AUTHENTICATION') {
      // Recupera anche eventi di login da Account table (se disponibili)
      const authEvents = await getAuthenticationEvents(whereConditions, limit, offset);
      auditEvents.push(...authEvents);
      
      // Riordina per timestamp
      auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Calcola statistiche per dashboard
    const stats = await calculateAuditStats(whereConditions);

    const response = {
      events: auditEvents.slice(0, limit), // Limita risultati dopo merge
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats,
      filters: {
        search,
        userId,
        eventType,
        level,
        department,
        dateFrom,
        dateTo
      },
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Errore nel recupero eventi audit:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Funzioni helper
function getCategoryFromEventType(eventType: string): string {
  const categoryMap: { [key: string]: string } = {
    'ENTRY': 'PRODUCTION',
    'EXIT': 'PRODUCTION',
    'TRANSFER': 'PRODUCTION',
    'QR_SCAN': 'PRODUCTION',
    'ODL_CREATE': 'ODL_MANAGEMENT',
    'ODL_UPDATE': 'ODL_MANAGEMENT',
    'ODL_DELETE': 'ODL_MANAGEMENT',
    'USER_LOGIN': 'AUTHENTICATION',
    'USER_LOGOUT': 'AUTHENTICATION',
    'FAILED_LOGIN': 'AUTHENTICATION',
    'PASSWORD_RESET': 'AUTHENTICATION',
    'SYSTEM_ERROR': 'SYSTEM',
    'CONFIG_CHANGE': 'SYSTEM'
  };
  return categoryMap[eventType] || 'OTHER';
}

function getLevelFromEventType(eventType: string): string {
  const levelMap: { [key: string]: string } = {
    'ENTRY': 'INFO',
    'EXIT': 'INFO',
    'TRANSFER': 'INFO',
    'QR_SCAN': 'INFO',
    'ODL_CREATE': 'INFO',
    'ODL_UPDATE': 'WARNING',
    'ODL_DELETE': 'ERROR',
    'USER_LOGIN': 'INFO',
    'USER_LOGOUT': 'INFO',
    'FAILED_LOGIN': 'WARNING',
    'PASSWORD_RESET': 'WARNING',
    'SYSTEM_ERROR': 'ERROR',
    'CONFIG_CHANGE': 'WARNING'
  };
  return levelMap[eventType] || 'INFO';
}

function getEventTitle(event: any): string {
  const titleMap: { [key: string]: string } = {
    'ENTRY': 'Ingresso Reparto',
    'EXIT': 'Uscita Reparto',
    'TRANSFER': 'Trasferimento ODL',
    'QR_SCAN': 'Scansione QR',
    'ODL_CREATE': 'Creazione ODL',
    'ODL_UPDATE': 'Modifica ODL',
    'ODL_DELETE': 'Eliminazione ODL'
  };
  return titleMap[event.eventType] || event.eventType;
}

async function getAuthenticationEvents(whereConditions: any, limit: number, offset: number) {
  // Implementazione semplificata - in produzione integrare con log di autenticazione
  return [];
}

async function calculateAuditStats(whereConditions: any) {
  const [
    totalEvents,
    todayEvents,
    errorEvents,
    warningEvents,
    userActivity,
    categoryStats
  ] = await Promise.all([
    prisma.productionEvent.count({ where: whereConditions }),
    prisma.productionEvent.count({
      where: {
        ...whereConditions,
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.productionEvent.count({
      where: {
        ...whereConditions,
        // Simula eventi di errore basati su descrizione
        description: {
          contains: 'errore',
          mode: 'insensitive'
        }
      }
    }),
    prisma.productionEvent.count({
      where: {
        ...whereConditions,
        description: {
          contains: 'warning',
          mode: 'insensitive'
        }
      }
    }),
    prisma.productionEvent.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: whereConditions,
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.productionEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: whereConditions,
      orderBy: { _count: { id: 'desc' } }
    })
  ]);

  return {
    totalEvents,
    todayEvents,
    errorEvents,
    warningEvents,
    topUsers: userActivity.map(user => ({
      userId: user.userId,
      eventCount: user._count.id
    })),
    categoryBreakdown: categoryStats.map(cat => ({
      category: getCategoryFromEventType(cat.eventType),
      eventType: cat.eventType,
      count: cat._count.id
    }))
  };
}