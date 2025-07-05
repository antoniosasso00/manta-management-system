#!/usr/bin/env tsx
/**
 * Script per resettare il database
 * Uso: DATABASE_URL="postgresql://..." npm run db:reset
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 Inizio reset database...')
  
  try {
    // Disabilita temporaneamente i vincoli di foreign key
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;')
    
    // Elimina tutti i dati in ordine inverso delle dipendenze
    console.log('🗑️  Eliminazione dati...')
    
    // Quality
    await prisma.qualityCertificate.deleteMany()
    await prisma.nonConformity.deleteMany()
    await prisma.qualityInspection.deleteMany()
    await prisma.qualityControlPlan.deleteMany()
    
    // Production Events and Related
    await prisma.autoclaveLoadItem.deleteMany()
    await prisma.autoclaveLoad.deleteMany()
    await prisma.productionEvent.deleteMany()
    
    // ODL
    await prisma.oDL.deleteMany()
    
    // Parts and Tools
    await prisma.partTool.deleteMany()
    await prisma.partHoneycomb.deleteMany()
    await prisma.partControlloNumerico.deleteMany()
    await prisma.partMontaggio.deleteMany()
    await prisma.partVerniciatura.deleteMany()
    await prisma.partMotori.deleteMany()
    await prisma.tool.deleteMany()
    await prisma.part.deleteMany()
    
    // Departments and Users
    await prisma.department.deleteMany()
    
    // Curing Cycles and Autoclaves
    await prisma.curingCycle.deleteMany()
    await prisma.autoclave.deleteMany()
    
    // System Tables
    await prisma.gammaSyncLog.deleteMany()
    await prisma.auditLog.deleteMany()
    
    // Auth Tables
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    
    // Riabilita i vincoli
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
    
    console.log('✅ Database resettato con successo!')
    console.log('')
    console.log('📝 Prossimi passi:')
    console.log('1. Esegui: npm run db:push (per ricreare lo schema se necessario)')
    console.log('2. Esegui: npm run db:seed (per popolare con dati di test)')
    console.log('3. Vai su /register per creare un nuovo utente admin')
    
  } catch (error) {
    console.error('❌ Errore durante il reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Controllo di sicurezza
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL non trovato!')
  console.log('Uso: DATABASE_URL="postgresql://..." npm run db:reset')
  process.exit(1)
}

if (!process.env.DATABASE_URL.includes('netlify') && !process.env.FORCE) {
  console.warn('⚠️  Attenzione: Sembra che tu non stia usando un database Netlify.')
  console.log('Se sei sicuro, esegui con FORCE=true')
  process.exit(1)
}

// Esegui reset
resetDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })