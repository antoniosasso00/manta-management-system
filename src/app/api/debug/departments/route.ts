import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Get all departments without auth for debugging
    const allDepartments = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
    })

    // Get count of active departments
    const activeCount = await prisma.department.count({
      where: { isActive: true }
    })

    // Get total count
    const totalCount = await prisma.department.count()

    return NextResponse.json({ 
      departments: allDepartments,
      activeCount,
      totalCount,
      message: 'Debug endpoint - remove in production'
    })

  } catch (error) {
    console.error('Debug departments error:', error)
    return NextResponse.json(
      { 
        error: 'Errore nel debug departments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}