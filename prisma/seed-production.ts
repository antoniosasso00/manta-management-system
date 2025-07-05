import { PrismaClient, DepartmentType, Priority, ODLStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedProduction() {
  console.log('🌱 Seeding production data...')

  // Crea reparti se non esistono
  const cleanRoom = await prisma.department.upsert({
    where: { code: 'CLEANROOM' },
    update: {},
    create: {
      code: 'CLEANROOM',
      name: 'Clean Room - Laminazione',
      type: DepartmentType.CLEANROOM,
      isActive: true
    }
  })

  const autoclave = await prisma.department.upsert({
    where: { code: 'AUTOCLAVE' },
    update: {},
    create: {
      code: 'AUTOCLAVE',
      name: 'Autoclavi',
      type: DepartmentType.AUTOCLAVE,
      isActive: true
    }
  })

  console.log('✅ Departments created')

  // Crea alcuni Part di esempio
  const parts = await Promise.all([
    prisma.part.upsert({
      where: { partNumber: '8G5350A057526' },
      update: {},
      create: {
        partNumber: '8G5350A057526',
        description: 'LONGERON RH UPPER',
        gammaId: 'GAMMA_001'
      }
    }),
    prisma.part.upsert({
      where: { partNumber: '8G5350A058528' },
      update: {},
      create: {
        partNumber: '8G5350A058528',
        description: 'LONGERON LH LOWER',
        gammaId: 'GAMMA_002'
      }
    }),
    prisma.part.upsert({
      where: { partNumber: 'EA53348179-043A1' },
      update: {},
      create: {
        partNumber: 'EA53348179-043A1',
        description: 'POGGIABDEI',
        gammaId: 'GAMMA_003'
      }
    }),
    prisma.part.upsert({
      where: { partNumber: 'EA53336A94-041' },
      update: {},
      create: {
        partNumber: 'EA53336A94-041',
        description: 'DISH ASSEMBLY',
        gammaId: 'GAMMA_004'
      }
    }),
    prisma.part.upsert({
      where: { partNumber: '8G5333A48331' },
      update: {},
      create: {
        partNumber: '8G5333A48331',
        description: 'WL 2470 REAR PANEL BONDED ASSY',
        gammaId: 'GAMMA_005'
      }
    }),
    prisma.part.upsert({
      where: { partNumber: 'EA53348130-043' },
      update: {},
      create: {
        partNumber: 'EA53348130-043',
        description: 'COVER BARE',
        gammaId: 'GAMMA_006'
      }
    })
  ])

  console.log('✅ Parts created')

  // Crea ODL di esempio con diversi stati
  const odls = await Promise.all([
    // ODL in preparazione
    prisma.oDL.create({
      data: {
        odlNumber: '017',
        partId: parts[0].id,
        quantity: 12,
        priority: Priority.NORMAL,
        status: ODLStatus.CREATED,
        qrCode: `QR_017_${Date.now()}`,
        gammaId: 'ODL_GAMMA_017'
      }
    }),
    prisma.oDL.create({
      data: {
        odlNumber: '018',
        partId: parts[3].id,
        quantity: 1,
        priority: Priority.HIGH,
        status: ODLStatus.CREATED,
        qrCode: `QR_018_${Date.now()}`,
        gammaId: 'ODL_GAMMA_018'
      }
    }),
    prisma.oDL.create({
      data: {
        odlNumber: '019',
        partId: parts[4].id,
        quantity: 1,
        priority: Priority.NORMAL,
        status: ODLStatus.CREATED,
        qrCode: `QR_019_${Date.now()}`,
        gammaId: 'ODL_GAMMA_019'
      }
    }),
    prisma.oDL.create({
      data: {
        odlNumber: '020',
        partId: parts[5].id,
        quantity: 1,
        priority: Priority.LOW,
        status: ODLStatus.CREATED,
        qrCode: `QR_020_${Date.now()}`,
        gammaId: 'ODL_GAMMA_020'
      }
    }),
    // ODL in laminazione
    prisma.oDL.create({
      data: {
        odlNumber: '006',
        partId: parts[1].id,
        quantity: 1,
        priority: Priority.URGENT,
        status: ODLStatus.IN_CLEANROOM,
        qrCode: `QR_006_${Date.now()}`,
        gammaId: 'ODL_GAMMA_006'
      }
    }),
    prisma.oDL.create({
      data: {
        odlNumber: '009',
        partId: parts[2].id,
        quantity: 1,
        priority: Priority.HIGH,
        status: ODLStatus.IN_CLEANROOM,
        qrCode: `QR_009_${Date.now()}`,
        gammaId: 'ODL_GAMMA_009'
      }
    })
  ])

  console.log('✅ ODLs created')

  // Crea eventi di produzione per ODL in laminazione
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  // Trova un utente operatore (assume che esista dal seed principale)
  const operator = await prisma.user.findFirst({
    where: { role: 'OPERATOR' }
  })

  if (operator) {
    // ODL 006 - In laminazione da 2 ore
    await prisma.productionEvent.create({
      data: {
        odlId: odls[4].id,
        departmentId: cleanRoom.id,
        eventType: 'ENTRY',
        timestamp: twoHoursAgo,
        userId: operator.id,
        notes: 'Inizio laminazione turno mattino'
      }
    })

    // ODL 009 - In laminazione da 1 ora
    await prisma.productionEvent.create({
      data: {
        odlId: odls[5].id,
        departmentId: cleanRoom.id,
        eventType: 'ENTRY',
        timestamp: oneHourAgo,
        userId: operator.id
      }
    })

    console.log('✅ Production events created')
  }

  console.log('✅ Production seed completed')
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  seedProduction()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}