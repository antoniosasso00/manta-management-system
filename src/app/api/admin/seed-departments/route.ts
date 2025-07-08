import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

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

    console.log('🏭 Inizializzazione reparti...')

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