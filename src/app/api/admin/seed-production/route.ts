import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    console.log('🌱 Inizializzazione seed produzione da API...')

    // 1. DEPARTMENTS - Solo i reparti essenziali
    console.log('🏭 Creazione reparti...')
    const departments = await Promise.all([
      prisma.department.upsert({
        where: { code: 'HC' },
        update: {},
        create: {
          code: 'HC',
          name: 'Honeycomb - Lavorazione Core',
          type: 'HONEYCOMB',
        },
      }),
      prisma.department.upsert({
        where: { code: 'CR' },
        update: {},
        create: {
          code: 'CR',
          name: 'Clean Room - Laminazione',
          type: 'CLEANROOM',
        },
      }),
      prisma.department.upsert({
        where: { code: 'CN' },
        update: {},
        create: {
          code: 'CN',
          name: 'Controllo Numerico - CNC',
          type: 'CONTROLLO_NUMERICO',
        },
      }),
      prisma.department.upsert({
        where: { code: 'RM' },
        update: {},
        create: {
          code: 'RM',
          name: 'Montaggio - Assembly',
          type: 'MONTAGGIO',
        },
      }),
      prisma.department.upsert({
        where: { code: 'AC' },
        update: {},
        create: {
          code: 'AC',
          name: 'Autoclavi - Cura',
          type: 'AUTOCLAVE',
        },
      }),
      prisma.department.upsert({
        where: { code: 'ND' },
        update: {},
        create: {
          code: 'ND',
          name: 'NDI - Controlli Non Distruttivi',
          type: 'NDI',
        },
      }),
      prisma.department.upsert({
        where: { code: 'VR' },
        update: {},
        create: {
          code: 'VR',
          name: 'Verniciatura - Coating',
          type: 'VERNICIATURA',
        },
      }),
      prisma.department.upsert({
        where: { code: 'MT' },
        update: {},
        create: {
          code: 'MT',
          name: 'Motori - Engine Components',
          type: 'MOTORI',
        },
      }),
      prisma.department.upsert({
        where: { code: 'CQ' },
        update: {},
        create: {
          code: 'CQ',
          name: 'Controllo Qualità - Quality Control',
          type: 'CONTROLLO_QUALITA',
        },
      }),
    ])

    // 2. CURING CYCLES - Solo i cicli base
    const curingCycles = await Promise.all([
      prisma.curingCycle.upsert({
        where: { code: 'CC001' },
        update: {},
        create: {
          code: 'CC001',
          name: 'Ciclo Standard 120°C',
          description: 'Ciclo di cura standard per componenti aerospaziali',
          phase1Temperature: 120,
          phase1Pressure: 6,
          phase1Duration: 120,
          phase2Temperature: 180,
          phase2Pressure: 7,
          phase2Duration: 90,
        },
      }),
      prisma.curingCycle.upsert({
        where: { code: 'CC002' },
        update: {},
        create: {
          code: 'CC002',
          name: 'Ciclo Rapido 100°C',
          description: 'Ciclo accelerato per componenti non critici',
          phase1Temperature: 100,
          phase1Pressure: 5,
          phase1Duration: 90,
        },
      }),
      prisma.curingCycle.upsert({
        where: { code: 'CC003' },
        update: {},
        create: {
          code: 'CC003',
          name: 'Ciclo Alta Temperatura 200°C',
          description: 'Ciclo per materiali ad alte prestazioni',
          phase1Temperature: 200,
          phase1Pressure: 8,
          phase1Duration: 180,
          phase2Temperature: 220,
          phase2Pressure: 9,
          phase2Duration: 60,
        },
      }),
    ])

    // 3. ADMIN USER - Solo se non esiste già
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@mantaaero.com' },
      update: {},
      create: {
        email: 'admin@mantaaero.com',
        password: hashedPassword,
        name: 'Admin System',
        role: 'ADMIN',
        isActive: true,
      },
    })

    // 4. AUTOCLAVES - Solo autoclavi base
    const autoclaves = await Promise.all([
      prisma.autoclave.upsert({
        where: { code: 'AC001' },
        update: {},
        create: {
          code: 'AC001',
          name: 'Autoclave Alpha',
          capacity: 1000,
          maxTemperature: 250,
          maxPressure: 10,
          isActive: true,
          departmentId: departments.find(d => d.code === 'AC')!.id,
        },
      }),
      prisma.autoclave.upsert({
        where: { code: 'AC002' },
        update: {},
        create: {
          code: 'AC002',
          name: 'Autoclave Beta',
          capacity: 800,
          maxTemperature: 220,
          maxPressure: 8,
          isActive: true,
          departmentId: departments.find(d => d.code === 'AC')!.id,
        },
      }),
    ])

    return NextResponse.json({
      message: 'Seed produzione completato con successo',
      data: {
        departments: departments.length,
        curingCycles: curingCycles.length,
        adminUser: adminUser.email,
        autoclaves: autoclaves.length,
      }
    })

  } catch (error) {
    console.error('Errore durante il seed produzione:', error)
    return NextResponse.json(
      { error: 'Errore durante il seed produzione' },
      { status: 500 }
    )
  }
}