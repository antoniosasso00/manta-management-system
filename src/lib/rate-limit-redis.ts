/**
 * Production-ready Redis-based rate limiting for MES Aerospazio
 * Supports distributed deployments and persistent rate limits
 */

interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: number
  totalAttempts?: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
  keyPrefix?: string
}

interface MemoryEntry {
  attempts: number[]
  blockedUntil: number
}

export class RedisRateLimiter {
  private redis: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
  private fallbackLimiter: Map<string, MemoryEntry> = new Map()
  private isRedisAvailable: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Defer initialization until first use
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL
      
      // Only initialize Redis if URL is provided
      if (redisUrl && typeof redisUrl === 'string' && redisUrl.length > 0) {
        const { default: Redis } = await import('ioredis')
        
        console.log('🔄 Attempting to connect to Redis at:', redisUrl.replace(/\/\/.*@/, '//***@'))
        
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 2000,
        })

        // Test connection
        await this.redis.ping()
        this.isRedisAvailable = true
        console.log('✅ Redis rate limiter initialized successfully')

        // Handle Redis errors gracefully
        this.redis.on('error', (error: Error) => {
          console.error('Redis error, falling back to in-memory:', error.message)
          this.isRedisAvailable = false
        })

        this.redis.on('connect', () => {
          console.log('✅ Redis connection restored')
          this.isRedisAvailable = true
        })

      } else {
        console.log('⚠️ No Redis URL provided, using in-memory rate limiting')
      }
    } catch (error: any) {
      console.error('❌ Redis initialization failed, using fallback:', error.message || error)
      this.isRedisAvailable = false
    }
  }

  /**
   * Ensure Redis is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeRedis()
    }
    await this.initializationPromise
  }

  /**
   * Check rate limit with sliding window algorithm
   */
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    await this.ensureInitialized()
    
    const { maxAttempts, windowMs, blockDurationMs, keyPrefix = 'rl' } = config
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()

    if (this.isRedisAvailable && this.redis) {
      return this.checkRedisLimit(key, now, maxAttempts, windowMs, blockDurationMs)
    } else {
      return this.checkMemoryLimit(key, now, maxAttempts, windowMs, blockDurationMs)
    }
  }

  /**
   * Redis-based rate limiting with Lua script for atomicity
   */
  private async checkRedisLimit(
    key: string,
    now: number,
    maxAttempts: number,
    windowMs: number,
    blockDurationMs: number
  ): Promise<RateLimitResult> {
    try {
      // Lua script for atomic rate limiting check
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local maxAttempts = tonumber(ARGV[2])
        local windowMs = tonumber(ARGV[3])
        local blockDurationMs = tonumber(ARGV[4])
        
        -- Check if currently blocked
        local blockKey = key .. ":blocked"
        local blocked = redis.call('GET', blockKey)
        if blocked and tonumber(blocked) > now then
          return {0, 0, tonumber(blocked), -1}
        end
        
        -- Clean old entries and count current attempts
        local windowStart = now - windowMs
        redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
        local attempts = redis.call('ZCARD', key)
        
        -- Add current attempt
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
        attempts = attempts + 1
        
        -- Check if limit exceeded
        if attempts > maxAttempts then
          -- Block the identifier
          local blockUntil = now + blockDurationMs
          redis.call('SET', blockKey, blockUntil, 'EX', math.ceil(blockDurationMs / 1000))
          return {0, 0, blockUntil, attempts}
        end
        
        local resetTime = now + windowMs
        local remaining = maxAttempts - attempts
        return {1, remaining, resetTime, attempts}
      `

      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        now.toString(),
        maxAttempts.toString(),
        windowMs.toString(),
        blockDurationMs.toString()
      ) as number[]

      return {
        allowed: result[0] === 1,
        remainingAttempts: result[1],
        resetTime: result[2],
        totalAttempts: result[3] > 0 ? result[3] : undefined,
      }

    } catch (error) {
      console.error('Redis rate limit check failed:', error)
      // Fallback to memory-based limiting
      this.isRedisAvailable = false
      return this.checkMemoryLimit(key, now, maxAttempts, windowMs, blockDurationMs)
    }
  }

  /**
   * Fallback in-memory rate limiting
   */
  private checkMemoryLimit(
    key: string,
    now: number,
    maxAttempts: number,
    windowMs: number,
    blockDurationMs: number
  ): RateLimitResult {
    const entry = this.fallbackLimiter.get(key) || {
      attempts: [],
      blockedUntil: 0,
    }

    // Check if currently blocked
    if (entry.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockedUntil,
      }
    }

    // Clean old attempts
    const windowStart = now - windowMs
    entry.attempts = entry.attempts.filter(time => time > windowStart)

    // Add current attempt
    entry.attempts.push(now)

    // Check if limit exceeded
    if (entry.attempts.length > maxAttempts) {
      entry.blockedUntil = now + blockDurationMs
      this.fallbackLimiter.set(key, entry)
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockedUntil,
      }
    }

    this.fallbackLimiter.set(key, entry)

    return {
      allowed: true,
      remainingAttempts: maxAttempts - entry.attempts.length,
      resetTime: now + windowMs,
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string, keyPrefix: string = 'rl'): Promise<void> {
    const key = `${keyPrefix}:${identifier}`
    
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key, `${key}:blocked`)
      } catch (error) {
        console.error('Redis reset failed:', error)
      }
    }
    
    this.fallbackLimiter.delete(key)
  }

  /**
   * Get current status for an identifier
   */
  async getStatus(identifier: string, keyPrefix: string = 'rl'): Promise<{
    isBlocked: boolean
    remainingAttempts: number
    resetTime: number
    totalAttempts: number
  }> {
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()

    if (this.isRedisAvailable && this.redis) {
      try {
        const blocked = await this.redis.get(`${key}:blocked`)
        if (blocked && parseInt(blocked) > now) {
          return {
            isBlocked: true,
            remainingAttempts: 0,
            resetTime: parseInt(blocked),
            totalAttempts: 0,
          }
        }

        const attempts = await this.redis.zcard(key)
        return {
          isBlocked: false,
          remainingAttempts: Math.max(0, 5 - attempts), // default max
          resetTime: 0,
          totalAttempts: attempts,
        }
      } catch (error) {
        console.error('Redis status check failed:', error)
      }
    }

    // Fallback to memory
    const entry = this.fallbackLimiter.get(key)
    if (!entry) {
      return {
        isBlocked: false,
        remainingAttempts: 5,
        resetTime: 0,
        totalAttempts: 0,
      }
    }

    const isBlocked = entry.blockedUntil > now
    return {
      isBlocked,
      remainingAttempts: isBlocked ? 0 : Math.max(0, 5 - entry.attempts.length),
      resetTime: isBlocked ? entry.blockedUntil : 0,
      totalAttempts: entry.attempts.length,
    }
  }

  /**
   * Cleanup expired entries (for memory fallback)
   */
  cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.fallbackLimiter.entries()) {
      // Remove if block has expired and no recent attempts
      if (
        entry.blockedUntil < now &&
        entry.attempts.length === 0
      ) {
        this.fallbackLimiter.delete(key)
      }
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    redisAvailable: boolean
    fallbackEntriesCount: number
    isConfigured: boolean
  } {
    return {
      redisAvailable: this.isRedisAvailable,
      fallbackEntriesCount: this.fallbackLimiter.size,
      isConfigured: !!process.env.REDIS_URL,
    }
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
    this.fallbackLimiter.clear()
  }
}

// Predefined rate limit configurations for different use cases
export const RATE_LIMIT_CONFIGS = {
  // Authentication attempts
  AUTH_LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    keyPrefix: 'auth_login',
  },
  
  // Password reset requests
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'pwd_reset',
  },
  
  // API general usage
  API_GENERAL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'api_general',
  },
  
  // QR code scanning (for production use)
  QR_SCAN: {
    maxAttempts: 50,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000, // 2 minutes
    keyPrefix: 'qr_scan',
  },
} as const

/**
 * Get client identifier from request with enhanced fingerprinting
 */
export async function getClientIdentifier(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
              request.headers.get('x-real-ip') || 
              'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Additional fingerprinting for better identification
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  // Create fingerprint
  const fingerprint = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`
  
  // Use Web Crypto API for Edge Runtime compatibility
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex.substring(0, 32) // Use first 32 chars for better distribution
}

// Create singleton instance
export const redisRateLimiter = new RedisRateLimiter()

// Cleanup task - run every 5 minutes in memory fallback mode
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    redisRateLimiter.cleanup()
  }, 5 * 60 * 1000)
}