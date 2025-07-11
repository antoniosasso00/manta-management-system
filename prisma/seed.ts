import { PrismaClient, UserRole, DepartmentType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting minimal database seed...')

  // Cleanup existing data in correct order (handle foreign keys)
  console.log('🧹 Cleaning database...')
  
  // Clean tables with foreign keys first - using try/catch for tables that might not exist
  try {
    await prisma.auditLog.deleteMany()
  } catch (e) { console.log('audit_logs table not found') }
  
  // syncLog table doesn't exist - skip
  // try {
  //   await prisma.syncLog.deleteMany()
  // } catch (e) { console.log('sync_logs table not found') }
  
  try {
    await prisma.productionEvent.deleteMany()
  } catch (e) { console.log('production_events table not found') }
  
  try {
    await prisma.autoclaveLoad.deleteMany()
  } catch (e) { console.log('autoclave_loads table not found') }
  
  try {
    await prisma.autoclaveLoad.deleteMany()
  } catch (e) { console.log('autoclave_loads table not found') }
  
  try {
    await prisma.oDL.deleteMany()
  } catch (e) { console.log('odls table not found') }
  
  try {
    await prisma.partTool.deleteMany()
  } catch (e) { console.log('part_tools table not found') }
  
  try {
    await prisma.partAutoclave.deleteMany()
  } catch (e) { console.log('part_autoclaves table not found') }
  
  try {
    await prisma.partCleanroom.deleteMany()
  } catch (e) { console.log('part_cleanrooms table not found') }
  
  try {
    await prisma.partNDI.deleteMany()
  } catch (e) { console.log('part_ndis table not found') }
  
  // userDepartment table doesn't exist - skip
  // try {
  //   await prisma.userDepartment.deleteMany()
  // } catch (e) { console.log('user_departments table not found') }
  
  // Clean main tables
  try {
    await prisma.user.deleteMany()
  } catch (e) { console.log('users table not found') }
  
  try {
    await prisma.autoclave.deleteMany()
  } catch (e) { console.log('autoclaves table not found') }
  
  try {
    await prisma.curingCycle.deleteMany()
  } catch (e) { console.log('curing_cycles table not found') }
  
  try {
    await prisma.part.deleteMany()
  } catch (e) { console.log('parts table not found') }
  
  try {
    await prisma.tool.deleteMany()
  } catch (e) { console.log('tools table not found') }
  
  try {
    await prisma.department.deleteMany()
  } catch (e) { console.log('departments table not found') }

  // Create admin user
  console.log('👥 Creating admin user...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mantaaero.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true
    }
  })

  // Create curing cycles
  console.log('🔥 Creating curing cycles...')
  const curingCycles = await prisma.curingCycle.createMany({
    data: [
      {
        code: 'A320-STD',
        name: 'Ciclo Standard A320',
        description: 'Ciclo di cura per componenti A320',
        phase1Temperature: 180,
        phase1Pressure: 7,
        phase1Duration: 90,
        phase2Temperature: 165,
        phase2Pressure: 5,
        phase2Duration: 30,
        isActive: true
      },
      {
        code: 'B777-RAP',
        name: 'Ciclo Rapido B777',
        description: 'Ciclo di cura rapido per componenti B777',
        phase1Temperature: 175,
        phase1Pressure: 6,
        phase1Duration: 75,
        phase2Temperature: 160,
        phase2Pressure: 4,
        phase2Duration: 25,
        isActive: true
      },
      {
        code: 'A330-DEL',
        name: 'Ciclo Delicato A330',
        description: 'Ciclo di cura delicato per componenti A330',
        phase1Temperature: 165,
        phase1Pressure: 5,
        phase1Duration: 120,
        phase2Temperature: 150,
        phase2Pressure: 3,
        phase2Duration: 40,
        isActive: true
      }
    ]
  })

  // Create all departments with correct codes
  console.log('🏭 Creating departments...')
  const departments = await prisma.department.createMany({
    data: [
      {
        code: 'HC',
        name: 'Honeycomb',
        type: DepartmentType.HONEYCOMB
      },
      {
        code: 'CR',
        name: 'Clean Room',
        type: DepartmentType.CLEANROOM
      },
      {
        code: 'AC',
        name: 'Autoclavi',
        type: DepartmentType.AUTOCLAVE
      },
      {
        code: 'CN',
        name: 'Controllo Numerico',
        type: DepartmentType.CONTROLLO_NUMERICO
      },
      {
        code: 'RM',
        name: 'Montaggio',
        type: DepartmentType.MONTAGGIO
      }
    ]
  })

  // Get autoclave department for foreign key
  const autoclavesDept = await prisma.department.findUnique({
    where: { code: 'AC' }
  })

  // Create autoclaves
  console.log('🏭 Creating autoclaves...')
  const autoclaves = await prisma.autoclave.createMany({
    data: [
      {
        code: 'AUTO-01',
        name: 'Autoclave 1',
        departmentId: autoclavesDept!.id,
        maxLength: 3000,
        maxWidth: 1500,
        vacuumLines: 8,
        isActive: true
      },
      {
        code: 'AUTO-02',
        name: 'Autoclave 2',
        departmentId: autoclavesDept!.id,
        maxLength: 2000,
        maxWidth: 1200,
        vacuumLines: 6,
        isActive: true
      },
      {
        code: 'AUTO-03',
        name: 'Autoclave 3',
        departmentId: autoclavesDept!.id,
        maxLength: 1500,
        maxWidth: 1000,
        vacuumLines: 4,
        isActive: true
      }
    ]
  })

  // Create basic parts
  console.log('🔩 Creating parts...')
  const parts = await prisma.part.createMany({
    data: [
      {
        partNumber: '8G5350A001',
        description: 'Pannello laterale A320 - Sinistra'
      },
      {
        partNumber: '8G5350A002',
        description: 'Pannello laterale A320 - Destra'
      },
      {
        partNumber: '7B7700B001',
        description: 'Longeron principale B777'
      },
      {
        partNumber: '3A3300C001',
        description: 'Skin superiore A330'
      },
      {
        partNumber: '8G5350A003',
        description: 'Bracket montaggio A320'
      }
    ]
  })

  // Create basic tools
  console.log('🔧 Creating tools...')
  const tools = await prisma.tool.createMany({
    data: [
      {
        toolPartNumber: 'TOOL-001',
        description: 'Stampo pannello A320',
        base: 1200,
        height: 50,
        weight: 150,
        isActive: true
      },
      {
        toolPartNumber: 'TOOL-002',
        description: 'Stampo longeron B777',
        base: 2000,
        height: 80,
        weight: 250,
        isActive: true
      },
      {
        toolPartNumber: 'TOOL-003',
        description: 'Stampo skin A330',
        base: 1800,
        height: 60,
        weight: 200,
        isActive: true
      },
      {
        toolPartNumber: 'TOOL-004',
        description: 'Stampo bracket piccolo',
        base: 300,
        height: 25,
        weight: 50,
        isActive: true
      },
      {
        toolPartNumber: 'TOOL-005',
        description: 'Stampo generico medio',
        base: 800,
        height: 40,
        weight: 100,
        isActive: true
      }
    ]
  })

  // Get created parts and curing cycles for associations
  console.log('🔗 Creating part-autoclave associations...')
  const createdParts = await prisma.part.findMany()
  const createdCycles = await prisma.curingCycle.findMany()

  // Create PartAutoclave configurations
  const partAutoclaveConfigs = await prisma.partAutoclave.createMany({
    data: [
      {
        partId: createdParts[0].id, // 8G5350A001
        curingCycleId: createdCycles[0].id, // A320-STD
        vacuumLines: 4,
        setupTime: 30,
        loadPosition: 'CENTER'
      },
      {
        partId: createdParts[1].id, // 8G5350A002
        curingCycleId: createdCycles[0].id, // A320-STD
        vacuumLines: 4,
        setupTime: 30,
        loadPosition: 'CENTER'
      },
      {
        partId: createdParts[2].id, // 7B7700B001
        curingCycleId: createdCycles[1].id, // B777-RAP
        vacuumLines: 6,
        setupTime: 45,
        loadPosition: 'FRONT'
      },
      {
        partId: createdParts[3].id, // 3A3300C001
        curingCycleId: createdCycles[2].id, // A330-DEL
        vacuumLines: 5,
        setupTime: 60,
        loadPosition: 'BACK'
      },
      {
        partId: createdParts[4].id, // 8G5350A003
        curingCycleId: createdCycles[0].id, // A320-STD
        vacuumLines: 2,
        setupTime: 15,
        loadPosition: 'SIDE'
      }
    ]
  })

  console.log('✅ Minimal seed completed successfully!')
  console.log('\n📊 DATI CREATI:')
  console.log('👥 Utenti: 1 (admin)')
  console.log('🏭 Reparti: 5 (tutti i reparti del workflow)')
  console.log('🔥 Cicli di cura: 3')
  console.log('🏭 Autoclavi: 3')
  console.log('🔩 Parti: 5')
  console.log('🔧 Tools: 5')
  console.log('🔗 Configurazioni Part-Autoclave: 5')
  console.log('\n🔑 CREDENZIALI LOGIN:')
  console.log('Admin: admin@mantaaero.com / password123')
  console.log('\n🏭 REPARTI CREATI:')
  console.log('- HC (Honeycomb)')
  console.log('- CR (Clean Room)')  
  console.log('- AC (Autoclavi)')
  console.log('- CN (Controllo Numerico)')
  console.log('- RM (Montaggio)')
  console.log('\n🔗 CONFIGURAZIONI PART-AUTOCLAVE:')
  console.log('- 8G5350A001 → A320-STD (4 linee vacuum)')
  console.log('- 8G5350A002 → A320-STD (4 linee vacuum)')
  console.log('- 7B7700B001 → B777-RAP (6 linee vacuum)')
  console.log('- 3A3300C001 → A330-DEL (5 linee vacuum)')
  console.log('- 8G5350A003 → A320-STD (2 linee vacuum)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })