import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickSeed() {
  console.log('🌱 Quick seed per autoclavi e cicli di cura...')
  
  try {
    // Cancella dati esistenti per evitare duplicati
    await prisma.autoclave.deleteMany()
    await prisma.curingCycle.deleteMany()
    await prisma.department.deleteMany()
    
    // Crea il reparto Autoclavi
    const department = await prisma.department.create({
      data: {
        code: 'AC',
        name: 'Autoclavi',
        type: 'AUTOCLAVE',
        isActive: true,
      }
    })
    
    // Crea cicli di cura
    const cycle1 = await prisma.curingCycle.create({
      data: {
        code: 'CC-STD-180',
        name: 'Ciclo Standard 180°C',
        description: 'Ciclo standard per compositi carbonio a 180°C',
        phase1Temperature: 180,
        phase1Pressure: 5,
        phase1Duration: 120, // 2 ore
        phase2Temperature: 180,
        phase2Pressure: 3,
        phase2Duration: 60,  // 1 ora
        isActive: true,
      }
    })
    
    const cycle2 = await prisma.curingCycle.create({
      data: {
        code: 'CC-HIGH-200',
        name: 'Ciclo Alta Temperatura 200°C',
        description: 'Ciclo ad alta temperatura per componenti critici',
        phase1Temperature: 200,
        phase1Pressure: 6,
        phase1Duration: 90,
        isActive: true,
      }
    })
    
    // Crea autoclavi
    const autoclave1 = await prisma.autoclave.create({
      data: {
        code: 'AC001',
        name: 'Autoclave Alpha',
        departmentId: department.id,
        maxLength: 3000,  // cm
        maxWidth: 1500,   // cm
        vacuumLines: 4,
        isActive: true,
      }
    })
    
    const autoclave2 = await prisma.autoclave.create({
      data: {
        code: 'AC002',
        name: 'Autoclave Beta',
        departmentId: department.id,
        maxLength: 2500,  // cm
        maxWidth: 1200,   // cm
        vacuumLines: 2,
        isActive: true,
      }
    })
    
    console.log('✅ Quick seed completato!')
    console.log(`- Reparto: ${department.name}`)
    console.log(`- Cicli di cura: ${cycle1.name}, ${cycle2.name}`)
    console.log(`- Autoclavi: ${autoclave1.name}, ${autoclave2.name}`)
    
  } catch (error) {
    console.error('❌ Errore durante quick seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickSeed()