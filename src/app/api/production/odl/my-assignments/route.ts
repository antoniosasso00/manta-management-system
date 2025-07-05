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

    // Trova ODL assegnati all'utente (con eventi di produzione)
    const odlAssignments = await prisma.oDL.findMany({
      where: {
        events: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        part: true,
        events: {
          where: {
            userId: userId
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1,
          include: {
            department: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Mappa i dati per il frontend
    const myODL = odlAssignments.map(odl => {
      const lastEvent = odl.events[0];
      const isActive = lastEvent?.eventType === 'ENTRY';
      
      let timeInDepartment = 0;
      if (isActive && lastEvent) {
        timeInDepartment = Math.floor(
          (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60)
        );
      }

      return {
        id: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        description: odl.part.description,
        status: odl.status,
        priority: odl.priority,
        quantity: odl.quantity,
        currentDepartment: lastEvent?.department?.name,
        timeInDepartment,
        isActive,
        lastEvent: lastEvent ? {
          eventType: lastEvent.eventType,
          timestamp: lastEvent.timestamp.toISOString()
        } : undefined
      };
    });

    return NextResponse.json(myODL);

  } catch (error) {
    console.error('My assignments API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}