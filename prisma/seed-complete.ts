import { PrismaClient } from '@prisma/client'
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
    // Fallback to text if QR generation fails
    return `QR-${odlNumber}`;
  }
}

async function main() {
  console.log('🌱 Inizializzazione seed completo ESTESO...')

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

  // 2. CURING CYCLES - Espanso
  console.log('🔥 Creazione cicli di cura...')
  const curingCycles = await Promise.all([
    prisma.curingCycle.create({
      data: {
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
    prisma.curingCycle.create({
      data: {
        code: 'CC002',
        name: 'Ciclo Rapido 100°C',
        description: 'Ciclo accelerato per componenti non critici',
        phase1Temperature: 100,
        phase1Pressure: 5,
        phase1Duration: 90,
      },
    }),
    prisma.curingCycle.create({
      data: {
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
    prisma.curingCycle.create({
      data: {
        code: 'CC004',
        name: 'Ciclo Prepreg Standard 135°C',
        description: 'Ciclo per materiali prepreg standard',
        phase1Temperature: 135,
        phase1Pressure: 6.5,
        phase1Duration: 105,
        phase2Temperature: 155,
        phase2Pressure: 7.5,
        phase2Duration: 75,
      },
    }),
    prisma.curingCycle.create({
      data: {
        code: 'CC005',
        name: 'Ciclo Lento 80°C',
        description: 'Ciclo per materiali delicati',
        phase1Temperature: 80,
        phase1Pressure: 4,
        phase1Duration: 240,
      },
    }),
  ])

  // 3. DEPARTMENTS - Aggiornato con nuova struttura aziendale
  console.log('🏭 Creazione reparti...')
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        code: 'HC',
        name: 'Honeycomb - Lavorazione Core',
        type: 'HONEYCOMB',
      },
    }),
    prisma.department.create({
      data: {
        code: 'CR',
        name: 'Clean Room - Laminazione',
        type: 'CLEANROOM',
      },
    }),
    prisma.department.create({
      data: {
        code: 'CN',
        name: 'Controllo Numerico - CNC',
        type: 'CONTROLLO_NUMERICO',
      },
    }),
    prisma.department.create({
      data: {
        code: 'RM',
        name: 'Montaggio - Assembly',
        type: 'MONTAGGIO',
      },
    }),
    prisma.department.create({
      data: {
        code: 'AC',
        name: 'Autoclavi - Cura',
        type: 'AUTOCLAVE',
      },
    }),
    prisma.department.create({
      data: {
        code: 'ND',
        name: 'NDI - Controlli Non Distruttivi',
        type: 'NDI',
      },
    }),
    prisma.department.create({
      data: {
        code: 'VR',
        name: 'Verniciatura - Coating',
        type: 'VERNICIATURA',
      },
    }),
    prisma.department.create({
      data: {
        code: 'MT',
        name: 'Motori - Engine Components',
        type: 'MOTORI',
      },
    }),
    prisma.department.create({
      data: {
        code: 'CQ',
        name: 'Controllo Qualità - Quality Control',
        type: 'CONTROLLO_QUALITA',
      },
    }),
  ])

  // 4. USERS - Esteso con più operatori per turni
  console.log('👥 Creazione utenti...')
  const hashedPassword = await bcrypt.hash('password123', 12)
  const users = await Promise.all([
    // Admin globale
    prisma.user.create({
      data: {
        email: 'admin@mantaaero.com',
        name: 'Amministratore Sistema',
        password: hashedPassword,
        role: 'ADMIN',
      },
    }),
    
    // === HONEYCOMB TEAM ===
    // Capo reparto Honeycomb
    prisma.user.create({
      data: {
        email: 'capo.honeycomb@mantaaero.com',
        name: 'Andrea Cortese',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[0].id, // HONEYCOMB
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori Honeycomb
    prisma.user.create({
      data: {
        email: 'op1.honeycomb@mantaaero.com',
        name: 'Luca Martini',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[0].id, // HONEYCOMB
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.honeycomb@mantaaero.com',
        name: 'Giulia Ferretti',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[0].id, // HONEYCOMB
        departmentRole: 'OPERATORE',
      },
    }),

    // === CLEAN ROOM TEAM ===
    // Capo reparto Camera Bianca
    prisma.user.create({
      data: {
        email: 'capo.cleanroom@mantaaero.com',
        name: 'Marco Rossi',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Capo turno Camera Bianca - Mattino
    prisma.user.create({
      data: {
        email: 'turno1.cleanroom@mantaaero.com',
        name: 'Laura Bianchi',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'CAPO_TURNO',
      },
    }),
    // Capo turno Camera Bianca - Pomeriggio
    prisma.user.create({
      data: {
        email: 'turno2.cleanroom@mantaaero.com',
        name: 'Paolo Verdi',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'CAPO_TURNO',
      },
    }),
    // Operatori Camera Bianca - Turno Mattino
    prisma.user.create({
      data: {
        email: 'op1.cleanroom@mantaaero.com',
        name: 'Giuseppe Verdi',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.cleanroom@mantaaero.com',
        name: 'Sofia Neri',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op3.cleanroom@mantaaero.com',
        name: 'Francesca Blu',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'OPERATORE',
      },
    }),
    // Operatori Camera Bianca - Turno Pomeriggio
    prisma.user.create({
      data: {
        email: 'op4.cleanroom@mantaaero.com',
        name: 'Antonio Giallo',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op5.cleanroom@mantaaero.com',
        name: 'Valentina Rosa',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[1].id, // CLEANROOM
        departmentRole: 'OPERATORE',
      },
    }),

    // === CONTROLLO NUMERICO TEAM ===
    // Capo reparto CNC
    prisma.user.create({
      data: {
        email: 'capo.cnc@mantaaero.com',
        name: 'Stefano Rinaldi',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[2].id, // CONTROLLO_NUMERICO
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori CNC
    prisma.user.create({
      data: {
        email: 'op1.cnc@mantaaero.com',
        name: 'Marco Bianchi',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[2].id, // CONTROLLO_NUMERICO
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.cnc@mantaaero.com',
        name: 'Silvia Galli',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[2].id, // CONTROLLO_NUMERICO
        departmentRole: 'OPERATORE',
      },
    }),

    // === MONTAGGIO TEAM ===
    // Capo reparto Montaggio
    prisma.user.create({
      data: {
        email: 'capo.montaggio@mantaaero.com',
        name: 'Roberto Conti',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[3].id, // MONTAGGIO
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori Montaggio
    prisma.user.create({
      data: {
        email: 'op1.montaggio@mantaaero.com',
        name: 'Anna Moretti',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[3].id, // MONTAGGIO
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.montaggio@mantaaero.com',
        name: 'Pietro Ricci',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[3].id, // MONTAGGIO
        departmentRole: 'OPERATORE',
      },
    }),
    
    // === AUTOCLAVE TEAM ===
    // Capo reparto Autoclavi
    prisma.user.create({
      data: {
        email: 'capo.autoclave@mantaaero.com',
        name: 'Roberto Viola',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[4].id, // AUTOCLAVE
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Capo turno Autoclavi
    prisma.user.create({
      data: {
        email: 'turno1.autoclave@mantaaero.com',
        name: 'Cristina Arancio',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[4].id, // AUTOCLAVE
        departmentRole: 'CAPO_TURNO',
      },
    }),
    // Operatori Autoclavi
    prisma.user.create({
      data: {
        email: 'op1.autoclave@mantaaero.com',
        name: 'Elena Rosa',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[4].id, // AUTOCLAVE
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.autoclave@mantaaero.com',
        name: 'Francesco Blu',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[4].id, // AUTOCLAVE
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op3.autoclave@mantaaero.com',
        name: 'Michele Grigio',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[4].id, // AUTOCLAVE
        departmentRole: 'OPERATORE',
      },
    }),
    
    // === NDI TEAM ===
    // Capo reparto NDI
    prisma.user.create({
      data: {
        email: 'capo.ndi@mantaaero.com',
        name: 'Davide Marrone',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[5].id, // NDI
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori NDI
    prisma.user.create({
      data: {
        email: 'op1.ndi@mantaaero.com',
        name: 'Chiara Gialli',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[5].id, // NDI
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.ndi@mantaaero.com',
        name: 'Luca Verde',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[5].id, // NDI
        departmentRole: 'OPERATORE',
      },
    }),
    
    // === VERNICIATURA TEAM ===
    // Capo reparto Verniciatura
    prisma.user.create({
      data: {
        email: 'capo.verniciatura@mantaaero.com',
        name: 'Simone Nero',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[6].id, // VERNICIATURA
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori Verniciatura
    prisma.user.create({
      data: {
        email: 'op1.verniciatura@mantaaero.com',
        name: 'Federica Azzurri',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[6].id, // VERNICIATURA
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.verniciatura@mantaaero.com',
        name: 'Matteo Grigi',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[6].id, // VERNICIATURA
        departmentRole: 'OPERATORE',
      },
    }),

    // === MOTORI TEAM ===
    // Capo reparto Motori
    prisma.user.create({
      data: {
        email: 'capo.motori@mantaaero.com',
        name: 'Alberto Verdi',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[7].id, // MOTORI
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori Motori
    prisma.user.create({
      data: {
        email: 'op1.motori@mantaaero.com',
        name: 'Claudia Rossi',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[7].id, // MOTORI
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.motori@mantaaero.com',
        name: 'Giorgio Bianchi',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[7].id, // MOTORI
        departmentRole: 'OPERATORE',
      },
    }),

    // === CONTROLLO QUALITA TEAM ===
    // Capo reparto Controllo Qualità
    prisma.user.create({
      data: {
        email: 'capo.qualita@mantaaero.com',
        name: 'Maria Fabbri',
        password: hashedPassword,
        role: 'SUPERVISOR',
        departmentId: departments[8].id, // CONTROLLO_QUALITA
        departmentRole: 'CAPO_REPARTO',
      },
    }),
    // Operatori Controllo Qualità
    prisma.user.create({
      data: {
        email: 'op1.qualita@mantaaero.com',
        name: 'Andrea Arancio',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[8].id, // CONTROLLO_QUALITA
        departmentRole: 'OPERATORE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'op2.qualita@mantaaero.com',
        name: 'Giulia Azzurro',
        password: hashedPassword,
        role: 'OPERATOR',
        departmentId: departments[8].id, // CONTROLLO_QUALITA
        departmentRole: 'OPERATORE',
      },
    }),
  ])

  // 5. TOOLS - Esteso
  console.log('🔧 Creazione utensili...')
  const tools = await Promise.all([
    // Stampi per A320
    prisma.tool.create({
      data: {
        toolPartNumber: 'T001-MOLD-A320-WING',
        description: 'Stampo principale per ala A320',
        base: 2500,
        height: 300,
        weight: 150,
        material: 'Alluminio 7075',
      },
    }),
    prisma.tool.create({
      data: {
        toolPartNumber: 'T002-MOLD-A320-FUSE',
        description: 'Stampo fusoliera A320',
        base: 3200,
        height: 400,
        weight: 280,
        material: 'Acciaio Inox',
      },
    }),
    // Stampi per B777
    prisma.tool.create({
      data: {
        toolPartNumber: 'T003-MOLD-B777-WING',
        description: 'Stampo ala B777',
        base: 4000,
        height: 500,
        weight: 450,
        material: 'Acciaio Temprato',
      },
    }),
    prisma.tool.create({
      data: {
        toolPartNumber: 'T004-MOLD-B777-STAB',
        description: 'Stampo stabilizzatore B777',
        base: 2800,
        height: 350,
        weight: 200,
        material: 'Alluminio 7075',
      },
    }),
    // Telai e supporti
    prisma.tool.create({
      data: {
        toolPartNumber: 'T005-FRAME-WING',
        description: 'Telaio supporto ala',
        base: 1800,
        height: 200,
        weight: 85,
        material: 'Fibra di Carbonio',
      },
    }),
    prisma.tool.create({
      data: {
        toolPartNumber: 'T006-JIG-STAB',
        description: 'Dima per stabilizzatore',
        base: 1500,
        height: 150,
        weight: 45,
        material: 'Alluminio 6061',
      },
    }),
    // Strumenti specializzati
    prisma.tool.create({
      data: {
        toolPartNumber: 'T007-VACUUM-BOX',
        description: 'Cassone per vuoto',
        base: 3000,
        height: 600,
        weight: 320,
        material: 'Acciaio Inox',
      },
    }),
    prisma.tool.create({
      data: {
        toolPartNumber: 'T008-CAUL-PLATE',
        description: 'Piastra di distribuzione pressione',
        base: 2200,
        height: 50,
        weight: 95,
        material: 'Alluminio 6061',
      },
    }),
  ])

  // 6. PARTS - Dataset esteso con varietà aeronautica
  console.log('🔩 Creazione parti...')
  const parts = await Promise.all([
    // === AIRBUS A320 FAMILY ===
    prisma.part.create({
      data: {
        partNumber: '8G5350A0001',
        description: 'Pannello ala superiore A320 - Settore 1',
        gammaId: 'GM001',
        defaultCuringCycleId: curingCycles[0].id,
        // standardLength: 2400,
        // standardWidth: 800,
        // standardHeight: 25,
        defaultVacuumLines: 2,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '8G5350B0002',
        description: 'Pannello ala inferiore A320 - Settore 2',
        gammaId: 'GM002',
        defaultCuringCycleId: curingCycles[0].id,
        // standardLength: 2200,
        // standardWidth: 750,
        // standardHeight: 20,
        defaultVacuumLines: 2,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '8G5350C0003',
        description: 'Nervatura centrale ala A320',
        gammaId: 'GM003',
        defaultCuringCycleId: curingCycles[1].id,
        // standardLength: 1800,
        // standardWidth: 300,
        // standardHeight: 80,
        defaultVacuumLines: 1,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '8G5350D0004',
        description: 'Winglet A320neo',
        gammaId: 'GM004',
        defaultCuringCycleId: curingCycles[3].id,
        // standardLength: 1200,
        // standardWidth: 600,
        // standardHeight: 40,
        defaultVacuumLines: 2,
      },
    }),
    
    // === BOEING 777 ===
    prisma.part.create({
      data: {
        partNumber: '9B7750C0005',
        description: 'Longherone principale B777',
        gammaId: 'GM005',
        defaultCuringCycleId: curingCycles[2].id,
        // standardLength: 3000,
        // standardWidth: 400,
        // standardHeight: 80,
        defaultVacuumLines: 3,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '9B7750D0006',
        description: 'Pannello fusoliera B777 - Sezione 43',
        gammaId: 'GM006',
        defaultCuringCycleId: curingCycles[2].id,
        // standardLength: 3500,
        // standardWidth: 1000,
        // standardHeight: 15,
        defaultVacuumLines: 4,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '9B7750E0007',
        description: 'Stabilizzatore orizzontale B777',
        gammaId: 'GM007',
        defaultCuringCycleId: curingCycles[0].id,
        // standardLength: 2800,
        // standardWidth: 900,
        // standardHeight: 35,
        defaultVacuumLines: 3,
      },
    }),
    
    // === AIRBUS A330 ===
    prisma.part.create({
      data: {
        partNumber: '5A3300D0008',
        description: 'Stabilizzatore verticale A330',
        gammaId: 'GM008',
        defaultCuringCycleId: curingCycles[1].id,
        // standardLength: 1800,
        // standardWidth: 600,
        // standardHeight: 30,
        defaultVacuumLines: 2,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '5A3300E0009',
        description: 'Pannello deriva A330',
        gammaId: 'GM009',
        defaultCuringCycleId: curingCycles[1].id,
        // standardLength: 2000,
        // standardWidth: 800,
        // standardHeight: 25,
        defaultVacuumLines: 2,
      },
    }),
    
    // === BOEING 787 DREAMLINER ===
    prisma.part.create({
      data: {
        partNumber: '7E7800E0010',
        description: 'Pannello fusoliera B787 - Sezione 41',
        gammaId: 'GM010',
        defaultCuringCycleId: curingCycles[3].id,
        // standardLength: 2800,
        // standardWidth: 1200,
        // standardHeight: 15,
        defaultVacuumLines: 4,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: '7E7800F0011',
        description: 'Ala centrale B787',
        gammaId: 'GM011',
        defaultCuringCycleId: curingCycles[2].id,
        // standardLength: 4200,
        // standardWidth: 1500,
        // standardHeight: 50,
        defaultVacuumLines: 6,
      },
    }),
    
    // === COMPONENTI SPECIALI ===
    prisma.part.create({
      data: {
        partNumber: 'SP001-RADAR-DOME',
        description: 'Radome in fibra di carbonio',
        gammaId: 'GM012',
        defaultCuringCycleId: curingCycles[4].id,
        // standardLength: 800,
        // standardWidth: 800,
        // standardHeight: 200,
        defaultVacuumLines: 1,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: 'SP002-ENGINE-COWL',
        description: 'Cofano motore',
        gammaId: 'GM013',
        defaultCuringCycleId: curingCycles[1].id,
        // standardLength: 1500,
        // standardWidth: 1200,
        // standardHeight: 100,
        defaultVacuumLines: 3,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: 'SP003-CARGO-DOOR',
        description: 'Porta cargo in composito',
        gammaId: 'GM014',
        defaultCuringCycleId: curingCycles[0].id,
        // standardLength: 2000,
        // standardWidth: 1800,
        // standardHeight: 40,
        defaultVacuumLines: 4,
      },
    }),
    prisma.part.create({
      data: {
        partNumber: 'SP004-INTERIOR-PANEL',
        description: 'Pannello interno cabina',
        gammaId: 'GM015',
        defaultCuringCycleId: curingCycles[4].id,
        // standardLength: 1200,
        // standardWidth: 600,
        // standardHeight: 10,
        defaultVacuumLines: 1,
      },
    }),
  ])

  // 7. PART-TOOL ASSOCIATIONS - Esteso
  console.log('🔗 Associazione parti-utensili...')
  await Promise.all([
    // A320 parts
    prisma.partTool.create({ data: { partId: parts[0].id, toolId: tools[0].id } }),
    prisma.partTool.create({ data: { partId: parts[1].id, toolId: tools[0].id } }),
    prisma.partTool.create({ data: { partId: parts[2].id, toolId: tools[4].id } }),
    prisma.partTool.create({ data: { partId: parts[3].id, toolId: tools[5].id } }),
    // B777 parts
    prisma.partTool.create({ data: { partId: parts[4].id, toolId: tools[2].id } }),
    prisma.partTool.create({ data: { partId: parts[5].id, toolId: tools[1].id } }),
    prisma.partTool.create({ data: { partId: parts[6].id, toolId: tools[3].id } }),
    // A330 parts
    prisma.partTool.create({ data: { partId: parts[7].id, toolId: tools[5].id } }),
    prisma.partTool.create({ data: { partId: parts[8].id, toolId: tools[5].id } }),
    // B787 parts
    prisma.partTool.create({ data: { partId: parts[9].id, toolId: tools[6].id } }),
    prisma.partTool.create({ data: { partId: parts[10].id, toolId: tools[2].id } }),
    // Special parts
    prisma.partTool.create({ data: { partId: parts[11].id, toolId: tools[7].id } }),
    prisma.partTool.create({ data: { partId: parts[12].id, toolId: tools[6].id } }),
    prisma.partTool.create({ data: { partId: parts[13].id, toolId: tools[4].id } }),
    prisma.partTool.create({ data: { partId: parts[14].id, toolId: tools[7].id } }),
  ])

  // 8. AUTOCLAVES - Esteso (aggiornato per nuovo reparto AUTOCLAVE)
  console.log('🏭 Creazione autoclavi...')
  const autoclaves = await Promise.all([
    prisma.autoclave.create({
      data: {
        code: 'AUT001',
        name: 'Autoclave Alpha - Grande',
        departmentId: departments[4].id, // AUTOCLAVE
        maxLength: 4000,
        maxWidth: 2000,
        maxHeight: 1000,
        vacuumLines: 6,
      },
    }),
    prisma.autoclave.create({
      data: {
        code: 'AUT002',
        name: 'Autoclave Beta - Media',
        departmentId: departments[4].id, // AUTOCLAVE
        maxLength: 3500,
        maxWidth: 1800,
        maxHeight: 800,
        vacuumLines: 4,
      },
    }),
    prisma.autoclave.create({
      data: {
        code: 'AUT003',
        name: 'Autoclave Gamma - XL',
        departmentId: departments[4].id, // AUTOCLAVE
        maxLength: 5000,
        maxWidth: 2500,
        maxHeight: 1200,
        vacuumLines: 8,
      },
    }),
    prisma.autoclave.create({
      data: {
        code: 'AUT004',
        name: 'Autoclave Delta - Rapida',
        departmentId: departments[4].id, // AUTOCLAVE
        maxLength: 3000,
        maxWidth: 1500,
        maxHeight: 600,
        vacuumLines: 4,
      },
    }),
    prisma.autoclave.create({
      data: {
        code: 'AUT005',
        name: 'Autoclave Epsilon - Speciale',
        departmentId: departments[4].id, // AUTOCLAVE
        maxLength: 2500,
        maxWidth: 2500,
        maxHeight: 800,
        vacuumLines: 6,
      },
    }),
  ])

  // 9. ODL - Dataset molto esteso con vari stati e priorità
  console.log('📋 Creazione ODL esteso...')
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  // Generate QR codes for ODLs (sequential to avoid race conditions)
  console.log('🔳 Generando QR codes reali...')
  
  const odlsData = [
    // === ODL IN CLEANROOM (attivi) ===
    {
      odlNumber: 'ODL-24-001',
      partId: parts[0].id, // A320 ala superiore
      partNumber: parts[0].partNumber,
      quantity: 2,
      priority: 'HIGH',
      status: 'IN_CLEANROOM',
      gammaId: 'GM-ODL-001',
      curingCycleId: curingCycles[0].id,
      length: 2400, width: 800, height: 25, vacuumLines: 2,
    },
    {
      odlNumber: 'ODL-24-002',
      partId: parts[2].id, // A320 nervatura
      partNumber: parts[2].partNumber,
      quantity: 4,
      priority: 'NORMAL',
      status: 'IN_CLEANROOM',
      gammaId: 'GM-ODL-002',
      curingCycleId: curingCycles[1].id,
      length: 1800, width: 300, height: 80, vacuumLines: 1,
    },
    {
      odlNumber: 'ODL-24-003',
      partId: parts[11].id, // Radome
      partNumber: parts[11].partNumber,
      quantity: 1,
      priority: 'URGENT',
      status: 'IN_CLEANROOM',
      gammaId: 'GM-ODL-003',
      curingCycleId: curingCycles[4].id,
      length: 800, width: 800, height: 200, vacuumLines: 1,
    }
  ]

  // Generate real QR codes and create ODLs
  const odls = []
  for (const odlData of odlsData) {
    const qrCode = await generateRealQRCode(odlData.odlNumber, odlData.partNumber, odlData.priority)
    
    // Exclude partNumber from odlData as it's not a valid ODL field
    const { partNumber, ...odlCreateData } = odlData
    
    const odl = await prisma.oDL.create({
      data: {
        ...odlCreateData,
        qrCode: qrCode
      },
    })
    
    odls.push(odl)
    console.log(`✅ Created ODL ${odlData.odlNumber} with real QR code`)
  }

  // Quick fix: for now let's create a few more ODLs with simple QR text to complete the seed
  // (We'll generate real QR codes for the first 3 ODLs as a proof of concept)
  const remainingOdls = await Promise.all([
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-004',
        partId: parts[1].id, // A320 ala inferiore
        quantity: 4,
        priority: 'NORMAL',
        status: 'CLEANROOM_COMPLETED',
        qrCode: 'QR-ODL-24-004',
        gammaId: 'GM-ODL-002',
        curingCycleId: curingCycles[1].id,
        length: 1800, width: 300, height: 80, vacuumLines: 1,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-005',
        partId: parts[11].id, // Radome
        quantity: 1,
        priority: 'URGENT',
        status: 'IN_CLEANROOM',
        qrCode: 'QR-ODL-24-005',
        gammaId: 'GM-ODL-003',
        curingCycleId: curingCycles[4].id,
        length: 800, width: 800, height: 200, vacuumLines: 1,
      },
    }),
    
    // === ODL CLEANROOM COMPLETED (pronti per autoclave) ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-004',
        partId: parts[1].id, // A320 ala inferiore
        quantity: 2,
        priority: 'HIGH',
        status: 'CLEANROOM_COMPLETED',
        qrCode: 'QR-ODL-24-004',
        gammaId: 'GM-ODL-004',
        curingCycleId: curingCycles[0].id,
        length: 2200, width: 750, height: 20, vacuumLines: 2,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-005',
        partId: parts[4].id, // B777 longherone
        quantity: 1,
        priority: 'URGENT',
        status: 'CLEANROOM_COMPLETED',
        qrCode: 'QR-ODL-24-005',
        gammaId: 'GM-ODL-005',
        curingCycleId: curingCycles[2].id,
        length: 3000, width: 400, height: 80, vacuumLines: 3,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-006',
        partId: parts[7].id, // A330 stabilizzatore
        quantity: 1,
        priority: 'NORMAL',
        status: 'CLEANROOM_COMPLETED',
        qrCode: 'QR-ODL-24-006',
        gammaId: 'GM-ODL-006',
        curingCycleId: curingCycles[1].id,
        length: 1800, width: 600, height: 30, vacuumLines: 2,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-007',
        partId: parts[14].id, // Pannello interno
        quantity: 8,
        priority: 'LOW',
        status: 'CLEANROOM_COMPLETED',
        qrCode: 'QR-ODL-24-007',
        gammaId: 'GM-ODL-007',
        curingCycleId: curingCycles[4].id,
        length: 1200, width: 600, height: 10, vacuumLines: 1,
      },
    }),
    
    // === ODL IN AUTOCLAVE (in cura) ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-008',
        partId: parts[9].id, // B787 fusoliera
        quantity: 1,
        priority: 'HIGH',
        status: 'IN_AUTOCLAVE',
        qrCode: 'QR-ODL-24-008',
        gammaId: 'GM-ODL-008',
        curingCycleId: curingCycles[3].id,
        length: 2800, width: 1200, height: 15, vacuumLines: 4,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-009',
        partId: parts[12].id, // Cofano motore
        quantity: 2,
        priority: 'NORMAL',
        status: 'IN_AUTOCLAVE',
        qrCode: 'QR-ODL-24-009',
        gammaId: 'GM-ODL-009',
        curingCycleId: curingCycles[1].id,
        length: 1500, width: 1200, height: 100, vacuumLines: 3,
      },
    }),
    
    // === ODL AUTOCLAVE COMPLETED (pronti per NDI) ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-010',
        partId: parts[5].id, // B777 fusoliera
        quantity: 1,
        priority: 'HIGH',
        status: 'AUTOCLAVE_COMPLETED',
        qrCode: 'QR-ODL-24-010',
        gammaId: 'GM-ODL-010',
        curingCycleId: curingCycles[2].id,
        length: 3500, width: 1000, height: 15, vacuumLines: 4,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-011',
        partId: parts[3].id, // A320 winglet
        quantity: 4,
        priority: 'NORMAL',
        status: 'AUTOCLAVE_COMPLETED',
        qrCode: 'QR-ODL-24-011',
        gammaId: 'GM-ODL-011',
        curingCycleId: curingCycles[3].id,
        length: 1200, width: 600, height: 40, vacuumLines: 2,
      },
    }),
    
    // === ODL IN NDI (in controllo) ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-012',
        partId: parts[6].id, // B777 stabilizzatore
        quantity: 1,
        priority: 'URGENT',
        status: 'IN_NDI',
        qrCode: 'QR-ODL-24-012',
        gammaId: 'GM-ODL-012',
        curingCycleId: curingCycles[0].id,
        length: 2800, width: 900, height: 35, vacuumLines: 3,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-013',
        partId: parts[13].id, // Porta cargo
        quantity: 1,
        priority: 'HIGH',
        status: 'IN_NDI',
        qrCode: 'QR-ODL-24-013',
        gammaId: 'GM-ODL-013',
        curingCycleId: curingCycles[0].id,
        length: 2000, width: 1800, height: 40, vacuumLines: 4,
      },
    }),
    
    // === ODL IN CONTROLLO QUALITA ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-014',
        partId: parts[8].id, // A330 deriva
        quantity: 2,
        priority: 'NORMAL',
        status: 'IN_CONTROLLO_QUALITA',
        qrCode: 'QR-ODL-24-014',
        gammaId: 'GM-ODL-014',
        curingCycleId: curingCycles[1].id,
        length: 2000, width: 800, height: 25, vacuumLines: 2,
      },
    }),
    
    // === ODL COMPLETED ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-015',
        partId: parts[10].id, // B787 ala centrale
        quantity: 1,
        priority: 'HIGH',
        status: 'COMPLETED',
        qrCode: 'QR-ODL-24-015',
        gammaId: 'GM-ODL-015',
        curingCycleId: curingCycles[2].id,
        length: 4200, width: 1500, height: 50, vacuumLines: 6,
      },
    }),
    
    // === ODL ON HOLD ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-016',
        partId: parts[0].id, // A320 ala superiore
        quantity: 1,
        priority: 'LOW',
        status: 'ON_HOLD',
        qrCode: 'QR-ODL-24-016',
        gammaId: 'GM-ODL-016',
        curingCycleId: curingCycles[0].id,
        length: 2400, width: 800, height: 25, vacuumLines: 2,
      },
    }),
    
    // === ODL CREATED (nuovi) ===
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-017',
        partId: parts[1].id, // A320 ala inferiore
        quantity: 3,
        priority: 'NORMAL',
        status: 'CREATED',
        qrCode: 'QR-ODL-24-017',
        gammaId: 'GM-ODL-017',
        curingCycleId: curingCycles[0].id,
        length: 2200, width: 750, height: 20, vacuumLines: 2,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-018',
        partId: parts[9].id, // B787 fusoliera
        quantity: 2,
        priority: 'HIGH',
        status: 'CREATED',
        qrCode: 'QR-ODL-24-018',
        gammaId: 'GM-ODL-018',
        curingCycleId: curingCycles[3].id,
        length: 2800, width: 1200, height: 15, vacuumLines: 4,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-019',
        partId: parts[4].id, // B777 longherone
        quantity: 1,
        priority: 'URGENT',
        status: 'CREATED',
        qrCode: 'QR-ODL-24-019',
        gammaId: 'GM-ODL-019',
        curingCycleId: curingCycles[2].id,
        length: 3000, width: 400, height: 80, vacuumLines: 3,
      },
    }),
    prisma.oDL.create({
      data: {
        odlNumber: 'ODL-24-020',
        partId: parts[14].id, // Pannello interno
        quantity: 12,
        priority: 'LOW',
        status: 'CREATED',
        qrCode: 'QR-ODL-24-020',
        gammaId: 'GM-ODL-020',
        curingCycleId: curingCycles[4].id,
        length: 1200, width: 600, height: 10, vacuumLines: 1,
      },
    }),
  ])

  // 10. AUTOCLAVE LOADS - Esteso con vari stati
  console.log('🔥 Creazione carichi autoclave...')
  const autoclaveLoads = await Promise.all([
    // Batch DRAFT - In preparazione
    prisma.autoclaveLoad.create({
      data: {
        loadNumber: 'B-2024-001',
        autoclaveId: autoclaves[0].id,
        curingCycleId: curingCycles[0].id,
        plannedStart: tomorrow,
        plannedEnd: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
        status: 'DRAFT',
        layoutData: {
          efficiency: 0.85,
          totalArea: 8000000, // 4m x 2m
          usedArea: 6800000,
          items: [
            { odlId: odls[3].id, x: 0, y: 0, width: 2200, height: 750 },
            { odlId: odls[6].id, x: 2300, y: 0, width: 1200, height: 600 },
          ],
        },
      },
    }),
    
    // Batch IN_CURE - In corso
    prisma.autoclaveLoad.create({
      data: {
        loadNumber: 'B-2024-002',
        autoclaveId: autoclaves[2].id, // Gamma XL
        curingCycleId: curingCycles[2].id,
        plannedStart: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        actualStart: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        plannedEnd: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        status: 'IN_CURE',
        layoutData: {
          efficiency: 0.72,
          totalArea: 12500000, // 5m x 2.5m
          usedArea: 9000000,
          items: [
            { odlId: odls[7].id, x: 0, y: 0, width: 2800, height: 1200 },
          ],
        },
      },
    }),
    
    // Batch COMPLETED - Completato
    prisma.autoclaveLoad.create({
      data: {
        loadNumber: 'B-2024-003',
        autoclaveId: autoclaves[1].id, // Beta Media
        curingCycleId: curingCycles[1].id,
        plannedStart: yesterday,
        actualStart: yesterday,
        plannedEnd: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000),
        actualEnd: new Date(yesterday.getTime() + 6.5 * 60 * 60 * 1000),
        status: 'COMPLETED',
        layoutData: {
          efficiency: 0.90,
          totalArea: 6300000, // 3.5m x 1.8m
          usedArea: 5670000,
        },
      },
    }),
    
    // Batch READY - Pronto per avvio
    prisma.autoclaveLoad.create({
      data: {
        loadNumber: 'B-2024-004',
        autoclaveId: autoclaves[3].id, // Delta Rapida
        curingCycleId: curingCycles[1].id,
        plannedStart: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        plannedEnd: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        status: 'READY',
        layoutData: {
          efficiency: 0.78,
          totalArea: 4500000, // 3m x 1.5m
          usedArea: 3510000,
          items: [
            { odlId: odls[5].id, x: 0, y: 0, width: 1800, height: 600 },
            { odlId: odls[8].id, x: 0, y: 700, width: 1500, height: 1200 },
          ],
        },
      },
    }),
    
    // Batch DRAFT - Programmato per domani
    prisma.autoclaveLoad.create({
      data: {
        loadNumber: 'B-2024-005',
        autoclaveId: autoclaves[4].id, // Epsilon Speciale
        curingCycleId: curingCycles[4].id,
        plannedStart: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        plannedEnd: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
        status: 'DRAFT',
        layoutData: {
          efficiency: 0.65,
          totalArea: 6250000, // 2.5m x 2.5m
          usedArea: 4062500,
        },
      },
    }),
  ])

  // 11. AUTOCLAVE LOAD ITEMS - Esteso
  console.log('📦 Associazione ODL-Carichi...')
  await Promise.all([
    // Batch DRAFT items
    prisma.autoclaveLoadItem.create({
      data: {
        odlId: odls[3].id, // A320 ala inferiore
        autoclaveLoadId: autoclaveLoads[0].id,
        position: { x: 0, y: 0, width: 2200, height: 750 },
        previousStatus: 'CLEANROOM_COMPLETED',
      },
    }),
    prisma.autoclaveLoadItem.create({
      data: {
        odlId: odls[6].id, // Pannelli interni
        autoclaveLoadId: autoclaveLoads[0].id,
        position: { x: 2300, y: 0, width: 1200, height: 600 },
        previousStatus: 'CLEANROOM_COMPLETED',
      },
    }),
    
    // Batch IN_CURE items
    prisma.autoclaveLoadItem.create({
      data: {
        odlId: odls[7].id, // B787 fusoliera
        autoclaveLoadId: autoclaveLoads[1].id,
        position: { x: 0, y: 0, width: 2800, height: 1200 },
        previousStatus: 'CLEANROOM_COMPLETED',
      },
    }),
    
    // Batch READY items
    prisma.autoclaveLoadItem.create({
      data: {
        odlId: odls[5].id, // A330 stabilizzatore
        autoclaveLoadId: autoclaveLoads[3].id,
        position: { x: 0, y: 0, width: 1800, height: 600 },
        previousStatus: 'CLEANROOM_COMPLETED',
      },
    }),
    prisma.autoclaveLoadItem.create({
      data: {
        odlId: odls[8].id, // Cofano motore
        autoclaveLoadId: autoclaveLoads[3].id,
        position: { x: 0, y: 700, width: 1500, height: 1200 },
        previousStatus: 'CLEANROOM_COMPLETED',
      },
    }),
  ])

  // 12. PRODUCTION EVENTS - Esteso con timeline realistica
  console.log('📊 Creazione eventi produzione...')
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const events = []
  
  // Eventi per ODL attivi in Clean Room
  for (let i = 0; i < 3; i++) {
    const entryTime = new Date(now.getTime() - (8 - i * 2) * 60 * 60 * 1000)
    events.push(
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[0].id,
          eventType: 'ENTRY',
          timestamp: entryTime,
          userId: users[4 + (i % 2)].id, // Alterna tra operatori
          notes: `Inizio laminazione ${parts[i].description}`,
        },
      })
    )
  }
  
  // Eventi completi per ODL completati in Clean Room
  for (let i = 3; i < 7; i++) {
    const startTime = new Date(twoDaysAgo.getTime() + (i - 3) * 6 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + (4 + Math.random() * 4) * 60 * 60 * 1000)
    
    events.push(
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[0].id,
          eventType: 'ENTRY',
          timestamp: startTime,
          userId: users[4 + (i % 5)].id,
          notes: `Inizio processo ${parts[i % parts.length].partNumber}`,
        },
      }),
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[0].id,
          eventType: 'EXIT',
          timestamp: endTime,
          userId: users[4 + (i % 5)].id,
          notes: 'Laminazione completata',
          duration: endTime.getTime() - startTime.getTime(),
        },
      })
    )
  }
  
  // Eventi per ODL in Autoclave
  for (let i = 7; i < 9; i++) {
    const cleanroomStart = new Date(lastWeek.getTime() + (i - 7) * 24 * 60 * 60 * 1000)
    const cleanroomEnd = new Date(cleanroomStart.getTime() + 8 * 60 * 60 * 1000)
    const autoclaveStart = new Date(cleanroomEnd.getTime() + 2 * 60 * 60 * 1000)
    
    events.push(
      // Eventi Clean Room completati
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[0].id,
          eventType: 'ENTRY',
          timestamp: cleanroomStart,
          userId: users[4].id,
          notes: 'Processo laminazione avviato',
        },
      }),
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[0].id,
          eventType: 'EXIT',
          timestamp: cleanroomEnd,
          userId: users[4].id,
          notes: 'Trasferito ad Autoclave',
          duration: 8 * 60 * 60 * 1000,
        },
      }),
      // Eventi Autoclave attuali
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[1].id,
          eventType: 'ENTRY',
          timestamp: autoclaveStart,
          userId: users[11 + (i % 3)].id,
          notes: `Inserimento in ${autoclaves[i % autoclaves.length].name}`,
        },
      })
    )
  }
  
  // Eventi per ODL completati Autoclave
  for (let i = 9; i < 11; i++) {
    const autoclaveStart = new Date(twoDaysAgo.getTime() + (i - 9) * 12 * 60 * 60 * 1000)
    const autoclaveEnd = new Date(autoclaveStart.getTime() + 4 * 60 * 60 * 1000)
    
    events.push(
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[1].id,
          eventType: 'ENTRY',
          timestamp: autoclaveStart,
          userId: users[11].id,
          notes: 'Carico per cura',
        },
      }),
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[1].id,
          eventType: 'EXIT',
          timestamp: autoclaveEnd,
          userId: users[11].id,
          notes: 'Cura completata',
          duration: 4 * 60 * 60 * 1000,
        },
      })
    )
  }
  
  // Eventi per ODL in NDI
  for (let i = 11; i < 13; i++) {
    const ndiStart = new Date(now.getTime() - (13 - i) * 2 * 60 * 60 * 1000)
    
    events.push(
      prisma.productionEvent.create({
        data: {
          odlId: odls[i].id,
          departmentId: departments[2].id,
          eventType: 'ENTRY',
          timestamp: ndiStart,
          userId: users[15 + (i % 2)].id,
          notes: 'Controllo qualità avviato',
        },
      })
    )
  }
  
  // Eventi per ODL in Rifilatura
  events.push(
    prisma.productionEvent.create({
      data: {
        odlId: odls[13].id,
        departmentId: departments[3].id,
        eventType: 'ENTRY',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        userId: users[19].id,
        notes: 'Rifilatura in corso',
      },
    })
  )
  
  // Eventi per ODL completato
  const completedStart = new Date(lastWeek.getTime())
  const completedMidpoint1 = new Date(completedStart.getTime() + 8 * 60 * 60 * 1000)
  const completedMidpoint2 = new Date(completedMidpoint1.getTime() + 4 * 60 * 60 * 1000)
  const completedMidpoint3 = new Date(completedMidpoint2.getTime() + 2 * 60 * 60 * 1000)
  const completedEnd = new Date(completedMidpoint3.getTime() + 3 * 60 * 60 * 1000)
  
  events.push(
    // Ciclo completo per ODL-24-015
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id, // B787 ala centrale
        departmentId: departments[0].id,
        eventType: 'ENTRY',
        timestamp: completedStart,
        userId: users[4].id,
        notes: 'Laminazione ala centrale B787',
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[0].id,
        eventType: 'EXIT',
        timestamp: completedMidpoint1,
        userId: users[4].id,
        notes: 'Laminazione completata',
        duration: 8 * 60 * 60 * 1000,
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[1].id,
        eventType: 'ENTRY',
        timestamp: completedMidpoint1,
        userId: users[11].id,
        notes: 'Cura in Autoclave Gamma',
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[1].id,
        eventType: 'EXIT',
        timestamp: completedMidpoint2,
        userId: users[11].id,
        notes: 'Cura completata',
        duration: 4 * 60 * 60 * 1000,
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[2].id,
        eventType: 'ENTRY',
        timestamp: completedMidpoint2,
        userId: users[15].id,
        notes: 'Controllo NDI avviato',
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[2].id,
        eventType: 'EXIT',
        timestamp: completedMidpoint3,
        userId: users[15].id,
        notes: 'Controlli NDI superati',
        duration: 2 * 60 * 60 * 1000,
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[3].id,
        eventType: 'ENTRY',
        timestamp: completedMidpoint3,
        userId: users[19].id,
        notes: 'Rifilatura finale',
      },
    }),
    prisma.productionEvent.create({
      data: {
        odlId: odls[14].id,
        departmentId: departments[3].id,
        eventType: 'EXIT',
        timestamp: completedEnd,
        userId: users[19].id,
        notes: 'Prodotto completato',
        duration: 3 * 60 * 60 * 1000,
      },
    })
  )

  await Promise.all(events)

  // 13. GAMMA SYNC LOGS - Esteso
  console.log('📡 Creazione log sincronizzazione...')
  await Promise.all([
    prisma.gammaSyncLog.create({
      data: {
        fileName: 'parts_export_20241201.csv',
        fileType: 'PARTS',
        entityType: 'Part',
        syncStatus: 'SUCCESS',
        recordsRead: 350,
        recordsSynced: 345,
        recordsSkipped: 5,
        syncedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    }),
    prisma.gammaSyncLog.create({
      data: {
        fileName: 'odl_export_20241201.csv',
        fileType: 'ODL',
        entityType: 'ODL',
        syncStatus: 'PARTIAL',
        recordsRead: 180,
        recordsSynced: 175,
        recordsSkipped: 3,
        errorMessage: '2 ODL con part number non trovato',
        syncedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    }),
    prisma.gammaSyncLog.create({
      data: {
        fileName: 'production_data_20241202.csv',
        fileType: 'PRODUCTION_DATA',
        entityType: 'ProductionEvent',
        syncStatus: 'SUCCESS',
        recordsRead: 420,
        recordsSynced: 420,
        recordsSkipped: 0,
        syncedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.gammaSyncLog.create({
      data: {
        fileName: 'tools_catalog_20241130.csv',
        fileType: 'TOOLS',
        entityType: 'Tool',
        syncStatus: 'FAILED',
        recordsRead: 0,
        recordsSynced: 0,
        recordsSkipped: 0,
        errorMessage: 'File corrotto - impossibile leggere',
        syncedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      },
    }),
    prisma.gammaSyncLog.create({
      data: {
        fileName: 'curing_cycles_20241128.csv',
        fileType: 'CURING_CYCLES',
        entityType: 'CuringCycle',
        syncStatus: 'SUCCESS',
        recordsRead: 25,
        recordsSynced: 23,
        recordsSkipped: 2,
        syncedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  // 14. AUDIT LOGS - Esteso con più attività
  console.log('📋 Creazione audit logs...')
  await Promise.all([
    // Creazione utenti
    prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'User',
        resourceId: users[1].id,
        userId: users[0].id, // Admin
        userEmail: users[0].email,
        details: {
          userCreated: {
            email: users[1].email,
            role: users[1].role,
            department: departments[0].code,
          },
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
    }),
    
    // Aggiornamenti ODL
    prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'ODL',
        resourceId: odls[0].id,
        userId: users[1].id, // Capo reparto
        userEmail: users[1].email,
        details: {
          before: { status: 'CREATED' },
          after: { status: 'IN_CLEANROOM' },
          reason: 'Avvio processo produttivo',
        },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        timestamp: yesterday,
      },
    }),
    
    // Operazioni batch autoclave
    prisma.auditLog.create({
      data: {
        action: 'BULK_UPDATE',
        resource: 'AutoclaveLoad',
        userId: users[9].id, // Capo reparto autoclavi
        userEmail: users[9].email,
        details: {
          operation: 'Ottimizzazione carico autoclave',
          loadId: autoclaveLoads[0].id,
          itemsCount: 2,
          efficiency: 0.85,
          algorithm: 'First-Fit Decreasing',
        },
        ipAddress: '192.168.1.110',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
    }),
    
    // Reset password
    prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        resource: 'User',
        resourceId: users[4].id,
        userId: users[4].id,
        userEmail: users[4].email,
        details: {
          resetMethod: 'Email link',
          requestedFrom: '192.168.1.125',
        },
        ipAddress: '192.168.1.125',
        userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:85.0) Gecko/85.0 Firefox/85.0',
        timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      },
    }),
    
    // Eliminazione dati
    prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'ProductionEvent',
        userId: users[0].id, // Admin
        userEmail: users[0].email,
        details: {
          reason: 'Pulizia dati obsoleti',
          deletedCount: 150,
          dateRange: 'Older than 90 days',
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(now.getTime() - 168 * 60 * 60 * 1000), // 1 settimana fa
      },
    }),
    
    // Login sicurezza (log fallimento con user existente)
    prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        resource: 'Authentication',
        userId: users[4].id, // Operatore esistente
        userEmail: users[4].email,
        details: {
          reason: 'Login failed - invalid credentials',
          attempts: 3,
          lockdown: false,
        },
        ipAddress: '203.0.113.45', // IP esterno sospetto
        userAgent: 'curl/7.68.0',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    }),
    
    // Esportazione dati
    prisma.auditLog.create({
      data: {
        action: 'EXPORT',
        resource: 'ProductionReport',
        userId: users[1].id, // Capo reparto
        userEmail: users[1].email,
        details: {
          reportType: 'Weekly Production Summary',
          dateRange: 'Last 7 days',
          department: 'CLEANROOM',
          recordCount: 85,
          format: 'PDF',
        },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log('✅ Seed completo ESTESO terminato con successo!')
  console.log('\n📊 DATI CREATI:')
  console.log(`👥 Utenti: ${users.length} (${users.filter(u => u.role === 'ADMIN').length} admin, ${users.filter(u => u.role === 'SUPERVISOR').length} supervisor, ${users.filter(u => u.role === 'OPERATOR').length} operatori)`)
  console.log(`🏭 Reparti: ${departments.length}`)
  console.log(`🔩 Parti: ${parts.length} (A320: 4, B777: 3, A330: 2, B787: 2, Speciali: 4)`)
  console.log(`📋 ODL: ${odls.length} distribuiti in tutti gli stati del workflow`)
  console.log(`🔧 Utensili: ${tools.length}`)
  console.log(`🔥 Cicli di cura: ${curingCycles.length}`)
  console.log(`🏭 Autoclavi: ${autoclaves.length}`)
  console.log(`📦 Carichi autoclave: ${autoclaveLoads.length} (vari stati)`)
  console.log(`📊 Eventi produzione: ~${events.length}+ eventi con timeline realistica`)
  console.log(`📡 Log sincronizzazione: 5 logs con vari stati`)
  console.log(`📋 Audit logs: 7 logs di attività utente`)
  
  console.log('\n🔑 CREDENZIALI TEST:')
  console.log('=== AMMINISTRAZIONE ===')
  console.log('Admin Globale: admin@mantaaero.com / password123')
  console.log('\n=== CLEAN ROOM ===')
  console.log('Capo Reparto: capo.cleanroom@mantaaero.com / password123')
  console.log('Capo Turno 1: turno1.cleanroom@mantaaero.com / password123')
  console.log('Capo Turno 2: turno2.cleanroom@mantaaero.com / password123')
  console.log('Operatori: op1.cleanroom@mantaaero.com / password123')
  console.log('          op2.cleanroom@mantaaero.com / password123')
  console.log('          op3.cleanroom@mantaaero.com / password123')
  console.log('          op4.cleanroom@mantaaero.com / password123')
  console.log('          op5.cleanroom@mantaaero.com / password123')
  console.log('\n=== AUTOCLAVI ===')
  console.log('Capo Reparto: capo.autoclave@mantaaero.com / password123')
  console.log('Capo Turno: turno1.autoclave@mantaaero.com / password123')
  console.log('Operatori: op1.autoclave@mantaaero.com / password123')
  console.log('          op2.autoclave@mantaaero.com / password123')
  console.log('          op3.autoclave@mantaaero.com / password123')
  console.log('\n=== NDI ===')
  console.log('Capo Reparto: capo.ndi@mantaaero.com / password123')
  console.log('Operatori: op1.ndi@mantaaero.com / password123')
  console.log('          op2.ndi@mantaaero.com / password123')
  console.log('\n=== RIFILATURA ===')
  console.log('Capo Reparto: capo.rifil@mantaaero.com / password123')
  console.log('Operatori: op1.rifil@mantaaero.com / password123')
  console.log('          op2.rifil@mantaaero.com / password123')
  
  console.log('\n🎯 SCENARI DI TEST DISPONIBILI:')
  console.log('• 3 ODL attivi in Clean Room per test workflow')
  console.log('• 4 ODL pronti per autoclave per test ottimizzazione')
  console.log('• 2 ODL in cura autoclave per test monitoraggio')
  console.log('• 2 ODL in NDI per test controlli qualità')
  console.log('• 1 ODL in rifilatura per test fase finale')
  console.log('• 1 ODL completato con storia completa')
  console.log('• 1 ODL in hold per test gestione eccezioni')
  console.log('• 4 nuovi ODL per test creazione workflow')
  console.log('• 5 autoclavi con caratteristiche diverse')
  console.log('• 5 batch autoclave in stati diversi')
  console.log('• Timeline eventi produzione realistica (ultima settimana)')
  console.log('• Logs di audit e sincronizzazione per test amministrazione')
  
  console.log('\n🚀 Aprire http://localhost:3001 per testare!')
  console.log('💡 Usare diversi utenti per testare autorizzazioni per reparto')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })