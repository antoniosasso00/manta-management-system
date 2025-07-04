import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/odl/qr-labels - Lista ODL per stampa QR
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const departmentId = searchParams.get('departmentId')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { odlNumber: { contains: search, mode: 'insensitive' } },
        { part: { partNumber: { contains: search, mode: 'insensitive' } } },
        { part: { description: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }


    const odls = await prisma.oDL.findMany({
      where,
      select: {
        id: true,
        odlNumber: true,
        qrCode: true,
        status: true,
        priority: true,
        createdAt: true,
        part: {
          select: {
            partNumber: true,
            description: true
          }
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(odls)
  } catch (error) {
    console.error('Error fetching ODL for QR labels:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}