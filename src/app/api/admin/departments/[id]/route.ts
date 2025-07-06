import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const departmentUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be max 10 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

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

    const department = await prisma.department.findUnique({
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
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);

  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const validated = departmentUpdateSchema.parse(body);

    // Check if department exists
    const existingDept = await prisma.department.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if code already exists (if updating code)
    if (validated.code && validated.code !== existingDept.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code: validated.code }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Department code already exists' },
          { status: 400 }
        );
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: resolvedParams.id },
      data: validated
    });

    return NextResponse.json(updatedDepartment);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users: true
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if department has associated data
    if (department.users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with assigned users' },
        { status: 400 }
      );
    }

    // Check for production events separately
    const eventCount = await prisma.productionEvent.count({
      where: { departmentId: resolvedParams.id }
    });
    
    if (eventCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with production events' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}