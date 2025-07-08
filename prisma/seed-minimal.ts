import { PrismaClient, ODLStatus, Priority, LoadStatus, UserRole, DepartmentRole, DepartmentType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { QRGenerator } from '../src/utils/qr-validation'

const prisma = new PrismaClient()

// Helper function to generate real QR codes for ODLs
async function generateRealQRCode(odlNumber: string, partNumber: string, priority?: string): Promise<string> {
  try {
    const qrData = QRGenerator.generateODLQR({
      id: odlNumber,
      partNumber: partNumber,
      priority: priority as any
    });
    
    const qrCodeSVG = await QRCode.toString(QRGenerator.toQRString(qrData), { type: 'svg' });
    return qrCodeSVG;
  } catch (error) {
    console.error(`Error generating QR for ${odlNumber}:`, error);
    return `QR-${odlNumber}`;
  }
}

async function main() {
  console.log('🌱 Inizializzazione seed MINIMALE per test avanzamento ODL...')

  // 1. PULIZIA DATABASE
  console.log('🧹 Pulizia database...')
  await prisma.auditLog.deleteMany()
  await prisma.productionEvent.deleteMany()
  await prisma.autoclaveLoadItem.deleteMany()
  await prisma.autoclaveLoad.deleteMany()
  await prisma.partTool.deleteMany()
  await prisma.oDL.deleteMany()
  await prisma.part.deleteMany()
  await prisma.tool.deleteMany()
  await prisma.autoclave.deleteMany()
  await prisma.curingCycle.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.gammaSyncLog.deleteMany()

  // 2. CURING CYCLE
  console.log('🔥 Creazione ciclo di cura...')
  const curingCycle = await prisma.curingCycle.create({
    data: {
      code: 'CC001',
      name: 'Ciclo Standard 120°C',
      description: 'Ciclo di cura standard per test',
      phase1Temperature: 120,
      phase1Pressure: 6,
      phase1Duration: 120,
      phase2Temperature: 180,
      phase2Pressure: 7,
      phase2Duration: 90,
    },
  })

  // 3. DEPARTMENTS
  console.log('🏭 Creazione reparti...')
  const cleanroom = await prisma.department.create({
    data: {
      code: 'CR',
      name: 'Clean Room - Laminazione',
      type: 'CLEANROOM',
    },
  })

  const autoclave = await prisma.department.create({
    data: {
      code: 'AC',
      name: 'Autoclavi - Cura',
      type: 'AUTOCLAVE',
    },
  })

  const ndi = await prisma.department.create({
    data: {
      code: 'ND',
      name: 'NDI - Controlli Non Distruttivi',
      type: 'NDI',
    },
  })

  const controlloQualita = await prisma.department.create({
    data: {
      code: 'CQ',
      name: 'Controllo Qualità',
      type: 'CONTROLLO_QUALITA',
    },
  })

  // 4. USERS
  console.log('👥 Creazione utenti...')
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mantaaero.com',
      name: 'Amministratore Sistema',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const capoCleanroom = await prisma.user.create({
    data: {
      email: 'capo.cleanroom@mantaaero.com',
      name: 'Marco Rossi',
      password: hashedPassword,
      role: 'SUPERVISOR',
      departmentId: cleanroom.id,
      departmentRole: 'CAPO_REPARTO',
    },
  })

  const operatorCleanroom = await prisma.user.create({
    data: {
      email: 'op1.cleanroom@mantaaero.com',
      name: 'Giuseppe Verdi',
      password: hashedPassword,
      role: 'OPERATOR',
      departmentId: cleanroom.id,
      departmentRole: 'OPERATORE',
    },
  })

  const capoAutoclave = await prisma.user.create({
    data: {
      email: 'capo.autoclave@mantaaero.com',
      name: 'Roberto Viola',
      password: hashedPassword,
      role: 'SUPERVISOR',
      departmentId: autoclave.id,
      departmentRole: 'CAPO_REPARTO',
    },
  })

  const operatorAutoclave = await prisma.user.create({
    data: {
      email: 'op1.autoclave@mantaaero.com',
      name: 'Elena Rosa',
      password: hashedPassword,
      role: 'OPERATOR',
      departmentId: autoclave.id,
      departmentRole: 'OPERATORE',
    },
  })

  const operatorNDI = await prisma.user.create({
    data: {
      email: 'op1.ndi@mantaaero.com',
      name: 'Chiara Gialli',
      password: hashedPassword,
      role: 'OPERATOR',
      departmentId: ndi.id,
      departmentRole: 'OPERATORE',
    },
  })

  const operatorQualita = await prisma.user.create({
    data: {
      email: 'op1.qualita@mantaaero.com',
      name: 'Andrea Arancio',
      password: hashedPassword,
      role: 'OPERATOR',
      departmentId: controlloQualita.id,
      departmentRole: 'OPERATORE',
    },
  })

  // 5. TOOL
  console.log('🔧 Creazione utensile...')
  const tool = await prisma.tool.create({
    data: {
      toolPartNumber: 'T001-MOLD-A320-WING',
      description: 'Stampo principale per ala A320',
      base: 2500,
      height: 300,
      weight: 150,
      material: 'Alluminio 7075',
    },
  })

  // 6. PART
  console.log('🔩 Creazione parte...')
  const part = await prisma.part.create({
    data: {
      partNumber: '8G5350A0001',
      description: 'Pannello ala superiore A320 - Test',
      gammaId: 'GM001',
      defaultCuringCycleId: curingCycle.id,
      defaultVacuumLines: 2,
    },
  })

  // 7. PART-TOOL ASSOCIATION
  console.log('🔗 Associazione parte-utensile...')
  await prisma.partTool.create({ 
    data: { 
      partId: part.id, 
      toolId: tool.id 
    } 
  })

  // 8. AUTOCLAVE
  console.log('🏭 Creazione autoclave...')
  const autoclaveUnit = await prisma.autoclave.create({
    data: {
      code: 'AUT001',
      name: 'Autoclave Alpha - Test',
      departmentId: autoclave.id,
      maxLength: 4000,
      maxWidth: 2000,
      maxHeight: 1000,
      vacuumLines: 6,
    },
  })

  // 9. ODL PRINCIPALE PER TEST
  console.log('📋 Creazione ODL di test...')
  const qrCode = await generateRealQRCode('ODL-TEST-001', part.partNumber, 'HIGH')
  
  const odl = await prisma.oDL.create({
    data: {
      odlNumber: 'ODL-TEST-001',
      partId: part.id,
      quantity: 2,
      priority: 'HIGH' as const,
      status: ODLStatus.CREATED,
      qrCode: qrCode,
      gammaId: 'GM-TEST-001',
      curingCycleId: curingCycle.id,
      length: 2400,
      width: 800,
      height: 25,
      vacuumLines: 2,
    },
  })

  // 10. AUTOCLAVE LOAD (vuoto, pronto per test)
  console.log('📦 Creazione carico autoclave...')
  const autoclaveLoad = await prisma.autoclaveLoad.create({
    data: {
      loadNumber: 'B-TEST-001',
      autoclaveId: autoclaveUnit.id,
      curingCycleId: curingCycle.id,
      plannedStart: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 ore da ora
      plannedEnd: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 ore da ora
      status: LoadStatus.DRAFT,
      layoutData: {
        efficiency: 0.0,
        totalArea: 8000000, // 4m x 2m
        usedArea: 0,
        items: [],
      },
    },
  })

  console.log('✅ Seed minimale completato con successo!')
  console.log('\n📊 DATI CREATI:')
  console.log(`👥 Utenti: 7 (1 admin, 2 supervisor, 4 operatori)`)
  console.log(`🏭 Reparti: 4 (Clean Room, Autoclave, NDI, Controllo Qualità)`)
  console.log(`🔩 Parti: 1 (${part.partNumber})`)
  console.log(`📋 ODL: 1 (${odl.odlNumber} - Stato: ${odl.status})`)
  console.log(`🔧 Utensili: 1`)
  console.log(`🔥 Cicli di cura: 1`)
  console.log(`🏭 Autoclavi: 1`)
  console.log(`📦 Carichi autoclave: 1 (vuoto)`)
  
  console.log('\n🔑 CREDENZIALI TEST:')
  console.log('Admin: admin@mantaaero.com / password123')
  console.log('Capo Clean Room: capo.cleanroom@mantaaero.com / password123')
  console.log('Operatore Clean Room: op1.cleanroom@mantaaero.com / password123')
  console.log('Capo Autoclave: capo.autoclave@mantaaero.com / password123')
  console.log('Operatore Autoclave: op1.autoclave@mantaaero.com / password123')
  console.log('Operatore NDI: op1.ndi@mantaaero.com / password123')
  console.log('Operatore Qualità: op1.qualita@mantaaero.com / password123')
  
  console.log('\n🎯 SCENARIO DI TEST:')
  console.log('• ODL-TEST-001 creato e pronto per workflow completo')
  console.log('• Stati disponibili: CREATED → IN_CLEANROOM → CLEANROOM_COMPLETED → IN_AUTOCLAVE → AUTOCLAVE_COMPLETED → IN_NDI → NDI_COMPLETED → IN_CONTROLLO_QUALITA → COMPLETED')
  console.log('• Ogni reparto ha operatori dedicati per test autorizzazioni')
  console.log('• Autoclave vuota pronta per test ottimizzazione')
  console.log('• QR Code reale generato per test scanning')
  
  console.log('\n🚀 Database pronto per test manuali dell\'avanzamento ODL!')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })