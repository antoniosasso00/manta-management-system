import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET per verificare lo stato dei reparti
export async function GET() {
  try {
    const session = await requireAuth()
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      )
    }

    const departments = await prisma.department.findMany({
      select: { code: true, name: true, type: true, isActive: true }
    })

    return NextResponse.json({
      count: departments.length,
      departments: departments
    })

  } catch (error) {
    console.error('Errore durante la verifica reparti:', error)
    return NextResponse.json(
      { error: 'Errore durante la verifica reparti' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await requireAuth()
    
    // Solo gli admin possono eseguire il seed
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono eseguire il seed.' },
        { status: 403 }
      )
    }

    // Verifica se i reparti esistono già
    const existingDepartments = await prisma.department.count()
    
    if (existingDepartments > 0) {
      const departments = await prisma.department.findMany({
        select: { code: true, name: true, type: true }
      })
      
      return NextResponse.json({
        message: 'Reparti già presenti nel database',
        count: existingDepartments,
        departments: departments
      })
    }

    console.log('🏭 Creazione reparti (database vuoto)...')

    // Lista completa dei reparti standard
    const departmentsData = [
      {
        code: 'HC',
        name: 'Honeycomb - Lavorazione Core',
        type: 'HONEYCOMB',
      },
      {
        code: 'CR',
        name: 'Clean Room - Laminazione',
        type: 'CLEANROOM',
      },
      {
        code: 'CN',
        name: 'Controllo Numerico - CNC',
        type: 'CONTROLLO_NUMERICO',
      },
      {
        code: 'RM',
        name: 'Montaggio - Assembly',
        type: 'MONTAGGIO',
      },
      {
        code: 'AC',
        name: 'Autoclavi - Cura',
        type: 'AUTOCLAVE',
      },
      {
        code: 'ND',
        name: 'NDI - Controlli Non Distruttivi',
        type: 'NDI',
      },
      {
        code: 'VR',
        name: 'Verniciatura - Coating',
        type: 'VERNICIATURA',
      },
      {
        code: 'MT',
        name: 'Motori - Engine Components',
        type: 'MOTORI',
      },
      {
        code: 'CQ',
        name: 'Controllo Qualità - Quality Control',
        type: 'CONTROLLO_QUALITA',
      },
    ]

    const departments = await Promise.all(
      departmentsData.map(dept =>
        prisma.department.upsert({
          where: { code: dept.code },
          update: {
            name: dept.name,
            type: dept.type as any,
            isActive: true,
          },
          create: {
            code: dept.code,
            name: dept.name,
            type: dept.type as any,
            isActive: true,
          },
        })
      )
    )

    return NextResponse.json({
      message: 'Reparti creati con successo',
      departments: departments.map(d => ({
        code: d.code,
        name: d.name,
        type: d.type
      }))
    })

  } catch (error) {
    console.error('Errore durante la creazione reparti:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione reparti' },
      { status: 500 }
    )
  }
}