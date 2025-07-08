import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('👤 Creazione utente admin...')
  
  try {
    // Cancella utenti esistenti per evitare duplicati
    await prisma.user.deleteMany()
    
    // Hash della password
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    // Crea l'utente admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mantaaero.com',
        name: 'Admin MES',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      }
    })
    
    console.log('✅ Utente admin creato!')
    console.log(`- Email: ${admin.email}`)
    console.log(`- Password: password123`)
    
  } catch (error) {
    console.error('❌ Errore durante creazione admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()