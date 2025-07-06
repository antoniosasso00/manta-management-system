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

    // Get system statistics
    const [
      totalUsers,
      activeUsers,
      totalODL,
      activeODL,
      completedODL,
      totalParts,
      totalDepartments,
      activeDepartments,
      todayEvents,
      weeklyEvents
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.oDL.count(),
      prisma.oDL.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.oDL.count({ where: { status: 'COMPLETED' } }),
      prisma.part.count(),
      prisma.department.count(),
      prisma.department.count({ where: { status: 'ACTIVE' } }),
      prisma.productionEvent.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.productionEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get department statistics
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        _count: {
          select: {
            users: true,
            productionEvents: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            }
          }
        }
      }
    });

    // Get recent activity
    const recentActivity = await prisma.productionEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        department: {
          select: { name: true, code: true }
        },
        odl: {
          select: { odlNumber: true }
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalODL,
        activeODL,
        completedODL,
        totalParts,
        totalDepartments,
        activeDepartments,
        todayEvents,
        weeklyEvents
      },
      departments: departmentStats.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        status: dept.status,
        userCount: dept._count.users,
        todayEvents: dept._count.productionEvents
      })),
      recentActivity: recentActivity.map(event => ({
        id: event.id,
        type: event.eventType,
        user: event.user?.name || 'Unknown',
        department: event.department?.name || 'Unknown',
        odl: event.odl?.odlNumber || 'N/A',
        timestamp: event.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}