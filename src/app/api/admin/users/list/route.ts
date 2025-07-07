import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ 
      users,
      departments,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR']
    })
  } catch (error) {
    console.error('Error fetching users list:', error)
    return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 })
  }
}