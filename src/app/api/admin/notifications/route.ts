import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recent system notifications based on recent events and issues
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get delayed ODL (more than 4 hours in current department)
    const delayedODL = await prisma.oDL.findMany({
      where: {
        status: {
          in: ['IN_HONEYCOMB', 'IN_CLEANROOM', 'IN_CONTROLLO_NUMERICO', 'IN_MONTAGGIO', 'IN_AUTOCLAVE', 'IN_NDI', 'IN_VERNICIATURA', 'IN_MOTORI', 'IN_CONTROLLO_QUALITA']
        },
        updatedAt: { lt: new Date(now.getTime() - 4 * 60 * 60 * 1000) }
      },
      include: {
        part: { select: { partNumber: true } }
      },
      take: 5
    });

    // Get recent completed batches
    const completedBatches = await prisma.autoclaveLoad.findMany({
      where: {
        status: 'COMPLETED',
        actualEnd: { gte: last24Hours }
      },
      include: {
        autoclave: { select: { name: true } },
        _count: { select: { loadItems: true } }
      },
      take: 3
    });

    // Get recent user registrations
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: last24Hours }
      },
      include: {
        department: { select: { name: true } }
      },
      take: 5
    });

    // Build notifications array
    const notifications = [];

    // Add delayed ODL notifications
    if (delayedODL.length > 0) {
      notifications.push({
        id: `delayed-odl-${Date.now()}`,
        type: 'warning',
        title: 'ODL in ritardo',
        message: `${delayedODL.length} ODL hanno superato il tempo previsto nei reparti`,
        timestamp: new Date()
      });
    }

    // Add completed batch notifications
    completedBatches.forEach((batch, index) => {
      notifications.push({
        id: `batch-completed-${batch.id}`,
        type: 'success',
        title: 'Batch completato',
        message: `${batch.autoclave?.name || 'Autoclave'} ha completato il ciclo con ${batch._count.loadItems} parti`,
        timestamp: batch.actualEnd
      });
    });

    // Add new user notifications
    newUsers.forEach((user, index) => {
      notifications.push({
        id: `new-user-${user.id}`,
        type: 'info',
        title: 'Nuovo utente registrato',
        message: `${user.name} (${user.department?.name || 'Nessun reparto'})`,
        timestamp: user.createdAt
      });
    });

    // Check for system issues (simplified check)
    const recentFailedEvents = await prisma.productionEvent.count({
      where: {
        timestamp: { gte: last24Hours },
        notes: { contains: 'error' }
      }
    });

    if (recentFailedEvents > 5) {
      notifications.push({
        id: `system-issues-${Date.now()}`,
        type: 'error',
        title: 'Problemi di sistema',
        message: `${recentFailedEvents} eventi con errori nelle ultime 24 ore`,
        timestamp: new Date()
      });
    }

    // Sort by timestamp (newest first) and limit to 10
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      notifications: sortedNotifications,
      total: sortedNotifications.length,
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}