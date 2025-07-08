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
  isActive: z.boolean().default(true),
  shiftConfiguration: z.object({
    shift1Start: z.string().default('06:00'),
    shift1End: z.string().default('14:00'),
    shift2Start: z.string().default('14:00'),
    shift2End: z.string().default('22:00'),
    hasThirdShift: z.boolean().default(false),
    shift3Start: z.string().optional(),
    shift3End: z.string().optional()
  }).optional(),
  performanceMetrics: z.object({
    targetEfficiency: z.number().min(0).max(100).default(85),
    targetCycleTime: z.number().min(0).default(120),
    maxODLCapacity: z.number().min(0).default(20),
    avgUtilizationRate: z.number().min(0).max(100).default(0)
  }).optional()
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

        // Calculate active ODLs in this department
        const activeODLs = await prisma.oDL.count({
          where: {
            currentDepartmentId: dept.id,
            status: { in: ['CREATED', 'ON_HOLD'] }
          }
        });

        // Calculate average processing time for last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentEvents = await prisma.productionEvent.findMany({
          where: {
            departmentId: dept.id,
            eventType: 'EXIT',
            timestamp: { gte: sevenDaysAgo }
          },
          include: {
            odl: {
              include: {
                productionEvents: {
                  where: {
                    departmentId: dept.id,
                    eventType: 'ENTRY'
                  },
                  take: 1,
                  orderBy: { timestamp: 'desc' }
                }
              }
            }
          }
        });

        let avgProcessingTime = 0;
        if (recentEvents.length > 0) {
          const processingTimes = recentEvents
            .filter(event => event.odl.productionEvents.length > 0)
            .map(event => {
              const entryTime = event.odl.productionEvents[0].timestamp;
              const exitTime = event.timestamp;
              return Math.abs(exitTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes
            });
          
          if (processingTimes.length > 0) {
            avgProcessingTime = Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length);
          }
        }

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.name,
          isActive: dept.isActive,
          totalOperators: dept._count.users,
          activeODL: activeODLs,
          averageProcessingTime: avgProcessingTime,
          efficiency: Math.round(efficiency * 10) / 10,
          shiftConfiguration: null,
          performanceMetrics: null
        };
      })
    );

    return NextResponse.json(departmentsWithStats);

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
        isActive: validated.isActive,
        shiftConfiguration: validated.shiftConfiguration,
        performanceMetrics: validated.performanceMetrics
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