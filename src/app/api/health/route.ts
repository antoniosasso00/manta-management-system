import { NextResponse } from "next/server"
import { redisRateLimiter } from "@/lib/rate-limit-redis"

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
    
    return NextResponse.json({
      status: "ok",
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
    })
  } catch (error: unknown) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}