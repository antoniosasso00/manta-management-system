import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-node'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const autoclaves = await prisma.autoclave.findMany({
      where: {
        isActive: true,
        department: {
          code: 'AC' // Codice reparto Autoclavi
        }
      },
      include: {
        department: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    return NextResponse.json({ 
      autoclaves,
      success: true 
    })
  } catch (error) {
    console.error('Errore recupero autoclavi:', error)
    return NextResponse.json(
      { error: 'Errore recupero autoclavi' },
      { status: 500 }
    )
  }
}