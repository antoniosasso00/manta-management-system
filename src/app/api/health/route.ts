import { NextResponse } from "next/server"
import { redisRateLimiter } from "@/lib/rate-limit-redis"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Get Redis stats
    const stats = redisRateLimiter.getStats()
    
    // Try to initialize and check a rate limit to test functionality
    const testResult = await redisRateLimiter.checkLimit("health-check", {
      maxAttempts: 100,
      windowMs: 60000,
      blockDurationMs: 60000,
      keyPrefix: "health"
    })
    
    // Test database connectivity
    let databaseStatus = 'ok';
    let databaseError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      databaseStatus = 'error';
      databaseError = dbError instanceof Error ? dbError.message : 'Database connection failed';
    }
    
    const isHealthy = databaseStatus === 'ok' && stats.redisAvailable;
    
    return NextResponse.json({
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        status: databaseStatus,
        error: databaseError
      },
      redis: {
        configured: stats.isConfigured,
        available: stats.redisAvailable,
        fallbackEntries: stats.fallbackEntriesCount,
        testAllowed: testResult.allowed,
        testRemaining: testResult.remainingAttempts
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        REDIS_URL_SET: !!process.env.REDIS_URL
      }
    }, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

export async function HEAD() {
  try {
    // Lightweight version for connectivity testing
    await prisma.$queryRaw`SELECT 1`;
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}