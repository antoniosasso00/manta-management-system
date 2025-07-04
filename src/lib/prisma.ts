import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Enable WebSocket support for Neon serverless driver
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Neon connection pool with optimized settings
const connectionString = process.env.DATABASE_URL!

const pool = new Pool({ 
  connectionString,
  // Neon-specific optimizations
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'), // Increased from 10 to 20
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  // Additional connection pool settings
  min: 2, // Minimum connections in pool
  acquireTimeoutMillis: 20000, // 20 seconds to acquire connection
  createTimeoutMillis: 20000, // 20 seconds to create connection
  destroyTimeoutMillis: 5000, // 5 seconds to destroy connection
  reapIntervalMillis: 1000, // Check for idle connections every second
})

// Create adapter for Prisma with Neon
const adapter = new PrismaNeon(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma