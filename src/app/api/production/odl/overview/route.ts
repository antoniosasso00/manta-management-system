import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { WorkflowService } from '@/domains/production/services/WorkflowService';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Solo SUPERVISOR e ADMIN possono vedere l'overview
    if (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato. Solo supervisori e amministratori possono visualizzare questa pagina.' },
        { status: 403 }
      );
    }

    // Pre-fetch tutti i departments per evitare N+1 queries
    const [odlList, allDepartments] = await Promise.all([
      prisma.oDL.findMany({
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
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true }
      })
    ]);

    // Crea mappa dei departments per lookup O(1)
    const departmentsByType = new Map(
      allDepartments.map(dept => [dept.type, dept])
    );

    // Mappa i dati per il frontend - NO async operations
    const productionODL = odlList.map((odl) => {
      const lastEvent = odl.events[0];
      const currentDepartment = lastEvent?.department?.name;
      
      // Calcola tempo nel reparto corrente
      let timeInDepartment = 0;
      if (lastEvent?.eventType === 'ENTRY') {
        timeInDepartment = Math.floor(
          (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60)
        );
      }

      // Trova prossimo reparto nel workflow usando la mappa
      let nextDepartment: string | undefined;
      if (lastEvent?.department) {
        const nextDepartmentType = WorkflowService.getNextDepartment(
          lastEvent.department.type
        );
        
        if (nextDepartmentType) {
          const nextDept = departmentsByType.get(nextDepartmentType);
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
        expectedCompletionDate: odl.expectedCompletionDate?.toISOString(),
        currentDepartment,
        assignedOperator: lastEvent?.user?.name,
        timeInDepartment,
        lastUpdate: odl.updatedAt.toISOString(),
        nextDepartment
      };
    });

    return NextResponse.json(productionODL);

  } catch (error) {
    console.error('Production overview API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}