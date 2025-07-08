import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const departmentImportSchema = z.object({
  departments: z.array(z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(10),
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

    // Import departments with default type
    const departmentsWithType = validated.departments.map(dept => ({
      ...dept,
      type: 'OTHER' as const
    }));
    
    const created = await prisma.department.createMany({
      data: departmentsWithType
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