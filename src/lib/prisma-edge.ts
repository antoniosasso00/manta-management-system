import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

// Prisma client configurato per edge runtime (Netlify Edge Functions)
function getPrismaEdge() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Export per edge runtime
export const prismaEdge = getPrismaEdge()