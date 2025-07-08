import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const assignUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user must be selected'),
  departmentRole: z.enum(['OPERATORE', 'CAPO_TURNO', 'CAPO_REPARTO']).default('OPERATORE')
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = assignUsersSchema.parse(body);

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if users exist
    const users = await prisma.user.findMany({
      where: { id: { in: validated.userIds } }
    });

    if (users.length !== validated.userIds.length) {
      return NextResponse.json({ error: 'One or more users not found' }, { status: 404 });
    }

    // Assign users to department
    await prisma.user.updateMany({
      where: { id: { in: validated.userIds } },
      data: {
        departmentId: resolvedParams.id,
        departmentRole: validated.departmentRole
      }
    });

    // Get updated department with users
    const updatedDepartment = await prisma.department.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentRole: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `${validated.userIds.length} users assigned to ${department.name}`,
      department: updatedDepartment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available users for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get users without department or in other departments
    const availableUsers = await prisma.user.findMany({
      where: {
        role: { in: ['OPERATOR', 'SUPERVISOR'] },
        departmentId: { not: resolvedParams.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentRole: true,
        department: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get users currently in this department
    const currentUsers = await prisma.user.findMany({
      where: { departmentId: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentRole: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      availableUsers,
      currentUsers,
      summary: {
        totalAvailable: availableUsers.length,
        totalCurrent: currentUsers.length,
        unassigned: availableUsers.filter(u => !u.department).length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}