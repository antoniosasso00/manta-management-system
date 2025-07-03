import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const departmentImportSchema = z.object({
  departments: z.array(z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(10),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
  }))
});

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
    const validated = departmentImportSchema.parse(body);

    // Check for duplicate codes
    const existingCodes = await prisma.department.findMany({
      select: { code: true }
    });
    
    const existingCodeSet = new Set(existingCodes.map(d => d.code));
    const duplicates = validated.departments.filter(dept => 
      existingCodeSet.has(dept.code)
    );

    if (duplicates.length > 0) {
      return NextResponse.json({
        error: 'Duplicate department codes found',
        duplicates: duplicates.map(d => d.code)
      }, { status: 400 });
    }

    // Import departments
    const created = await prisma.department.createMany({
      data: validated.departments
    });

    return NextResponse.json({
      message: 'Departments imported successfully',
      imported: created.count,
      departments: validated.departments
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error importing departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}