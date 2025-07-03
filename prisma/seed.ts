import { PrismaClient, UserRole, DepartmentRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedProduction } from './seed-production'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Crea utenti di esempio
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@manta.com' },
    update: {},
    create: {
      email: 'admin@manta.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true
    }
  })

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@manta.com' },
    update: {},
    create: {
      email: 'supervisor@manta.com',
      name: 'Supervisor User',
      password: hashedPassword,
      role: UserRole.SUPERVISOR,
      isActive: true
    }
  })

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@manta.com' },
    update: {},
    create: {
      email: 'operator@manta.com',
      name: 'Operator User',
      password: hashedPassword,
      role: UserRole.OPERATOR,
      isActive: true
    }
  })

  console.log('✅ Users created')

  // Crea dati di produzione
  await seedProduction()

  // Assegna operatore al reparto Clean Room
  const cleanRoom = await prisma.department.findUnique({
    where: { code: 'CLEANROOM' }
  })

  if (cleanRoom) {
    await prisma.user.update({
      where: { id: operatorUser.id },
      data: {
        departmentId: cleanRoom.id,
        departmentRole: DepartmentRole.OPERATORE
      }
    })

    await prisma.user.update({
      where: { id: supervisorUser.id },
      data: {
        departmentId: cleanRoom.id,
        departmentRole: DepartmentRole.CAPO_TURNO
      }
    })

    console.log('✅ Users assigned to departments')
  }

  console.log('✅ Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('Admin: admin@manta.com / password123')
  console.log('Supervisor: supervisor@manta.com / password123')
  console.log('Operator: operator@manta.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })