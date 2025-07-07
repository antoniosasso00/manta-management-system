import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs'

const departmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be max 10 characters'),
  type: z.enum(['HONEYCOMB', 'CLEANROOM', 'CONTROLLO_NUMERICO', 'MONTAGGIO', 'AUTOCLAVE', 'NDI', 'VERNICIATURA', 'MOTORI', 'CONTROLLO_QUALITA', 'OTHER']).default('OTHER'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate efficiency and completed orders for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        
        const [completedToday, totalEvents] = await Promise.all([
          // Count completed ODLs by checking latest events
          prisma.productionEvent.count({
            where: {
              departmentId: dept.id,
              eventType: 'EXIT',
              timestamp: { gte: todayStart }
            }
          }),
          prisma.productionEvent.count({
            where: {
              departmentId: dept.id,
              timestamp: { gte: todayStart }
            }
          })
        ]);

        // Calculate efficiency based on completed vs total events
        const efficiency = totalEvents > 0 ? (completedToday / totalEvents) * 100 : 0;

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.name,
          status: dept.isActive ? 'ACTIVE' : 'INACTIVE',
          currentOperators: dept._count.users,
          totalCapacity: dept._count.users > 0 ? dept._count.users + 2 : 5, // Simple capacity calculation
          efficiency: Math.round(efficiency * 10) / 10,
          completedToday
        };
      })
    );

    return NextResponse.json({
      departments: departmentsWithStats,
      total: departmentsWithStats.length
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = departmentSchema.parse(body);

    // Check if code already exists
    const existingDept = await prisma.department.findUnique({
      where: { code: validated.code }
    });

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name: validated.name,
        code: validated.code,
        type: validated.type,
        isActive: validated.status === 'ACTIVE'
      }
    });

    return NextResponse.json(department, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}