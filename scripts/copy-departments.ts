import { PrismaClient } from '@prisma/client'

// Database locale
const localPrisma = new PrismaClient()

// Database produzione (Netlify)
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

async function copyDepartments() {
  try {
    console.log('🔄 Copiando reparti dal database locale a produzione...')

    // 1. Leggi reparti dal database locale
    const localDepartments = await localPrisma.department.findMany({
      select: {
        code: true,
        name: true,
        type: true,
        isActive: true,
      }
    })

    console.log(`📋 Trovati ${localDepartments.length} reparti nel database locale`)

    if (localDepartments.length === 0) {
      console.log('❌ Nessun reparto trovato nel database locale. Esegui prima npm run db:seed-complete')
      return
    }

    // 2. Inserisci/aggiorna reparti nel database produzione
    for (const dept of localDepartments) {
      const result = await prodPrisma.department.upsert({
        where: { code: dept.code },
        update: {
          name: dept.name,
          type: dept.type,
          isActive: dept.isActive,
        },
        create: {
          code: dept.code,
          name: dept.name,
          type: dept.type,
          isActive: dept.isActive,
        }
      })
      
      console.log(`✅ ${dept.code}: ${dept.name}`)
    }

    console.log('🎉 Copia reparti completata con successo!')

    // 3. Verifica
    const prodDepartments = await prodPrisma.department.findMany({
      select: { code: true, name: true }
    })
    
    console.log(`📊 Reparti ora presenti in produzione: ${prodDepartments.length}`)
    prodDepartments.forEach(dept => console.log(`   - ${dept.code}: ${dept.name}`))

  } catch (error) {
    console.error('❌ Errore durante la copia dei reparti:', error)
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

copyDepartments()