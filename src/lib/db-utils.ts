import { prisma } from '@/lib/prisma'

/**
 * Wrapper for database operations with error handling and retry logic
 */
export async function withDatabase<T>(
  operation: (prisma: typeof prisma) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma)
  } catch (error: any) {
    // Handle Neon-specific connection errors
    if (error?.code === 'P2024') {
      console.error('Database connection pool timeout')
      // Could implement retry logic here
      throw new Error('Database connection timeout - please try again')
    }
    
    if (error?.code === 'ECONNREFUSED') {
      console.error('Database connection refused - possible cold start')
      throw new Error('Database temporarily unavailable - please try again')
    }
    
    if (error?.code === '53300') {
      console.error('Too many database connections')
      throw new Error('Database connection limit reached - please try again')
    }
    
    // Re-throw other errors
    throw error
  }
}

/**
 * Check database health and connection
 */
export async function checkDatabaseHealth() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    console.log('Database health check passed', { duration, status: 'healthy' })
    
    return { 
      healthy: true, 
      latency: duration,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Database health check failed', error)
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Gracefully close database connections
 */
export async function closeDatabaseConnections() {
  try {
    await prisma.$disconnect()
    console.log('Database connections closed gracefully')
  } catch (error) {
    console.error('Error closing database connections', error)
  }
}