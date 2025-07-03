import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { WorkflowService } from '@/domains/production/services/WorkflowService';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni tutti gli ODL con le informazioni di produzione
    const odlList = await prisma.oDL.findMany({
      include: {
        part: true,
        events: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1,
          include: {
            user: true,
            department: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Mappa i dati per il frontend
    const productionODL = await Promise.all(
      odlList.map(async (odl) => {
        const lastEvent = odl.events[0];
        const currentDepartment = lastEvent?.department?.name;
        
        // Calcola tempo nel reparto corrente
        let timeInDepartment = 0;
        if (lastEvent?.eventType === 'ENTRY') {
          timeInDepartment = Math.floor(
            (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60)
          );
        }

        // Trova prossimo reparto nel workflow
        let nextDepartment: string | undefined;
        if (lastEvent?.department) {
          const nextDepartmentType = WorkflowService.getNextDepartment(
            lastEvent.department.type
          );
          
          if (nextDepartmentType) {
            const nextDept = await prisma.department.findFirst({
              where: { type: nextDepartmentType, isActive: true }
            });
            nextDepartment = nextDept?.name;
          }
        }

        return {
          id: odl.id,
          odlNumber: odl.odlNumber,
          partNumber: odl.part.partNumber,
          description: odl.part.description,
          status: odl.status,
          priority: odl.priority,
          quantity: odl.quantity,
          currentDepartment,
          assignedOperator: lastEvent?.user?.name,
          timeInDepartment,
          lastUpdate: odl.updatedAt.toISOString(),
          nextDepartment
        };
      })
    );

    return NextResponse.json(productionODL);

  } catch (error) {
    console.error('Production overview API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}