import { PrismaClient, UserRole, DepartmentRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

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