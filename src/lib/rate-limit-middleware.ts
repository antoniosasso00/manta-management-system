import { NextRequest, NextResponse } from 'next/server';
import { redisRateLimiter, getClientIdentifier, RATE_LIMIT_CONFIGS } from './rate-limit-redis';

/**
 * Middleware per rate limiting sulle API routes
 * Protegge le API critiche del sistema MES da abusi
 */

interface RateLimitOptions {
  keyPrefix?: string;
  maxAttempts?: number;
  windowMs?: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  customKeyGenerator?: (req: NextRequest) => Promise<string>;
  onLimitReached?: (req: NextRequest) => void;
}

/**
 * Factory function per creare middleware di rate limiting
 */
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Genera identificatore client
      const clientId = options.customKeyGenerator 
        ? await options.customKeyGenerator(req)
        : await getClientIdentifier(req);

      // Configurazione rate limit
      const config = {
        maxAttempts: options.maxAttempts || 60,
        windowMs: options.windowMs || 60 * 1000, // 1 minuto default
        blockDurationMs: options.blockDurationMs || 5 * 60 * 1000, // 5 minuti default
        keyPrefix: options.keyPrefix || 'api_general',
      };

      // Controlla rate limit
      const rateLimitResult = await redisRateLimiter.checkLimit(clientId, config);

      if (!rateLimitResult.allowed) {
        // Log tentativo bloccato
        console.warn(`Rate limit exceeded for ${clientId} on ${req.nextUrl.pathname}`);
        
        // Callback opzionale
        if (options.onLimitReached) {
          options.onLimitReached(req);
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Troppi tentativi. Riprova più tardi.',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': config.maxAttempts.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remainingAttempts.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            },
          }
        );
      }

      // Esegui handler
      const response = await handler(req);

      // Aggiungi headers informativi
      response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingAttempts.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      // Reset rate limit se richiesta ha successo e skipSuccessfulRequests è true
      if (options.skipSuccessfulRequests && response.status < 400) {
        await redisRateLimiter.reset(clientId, config.keyPrefix);
      }

      return response;

    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // In caso di errore del rate limiter, lascia passare la richiesta
      return await handler(req);
    }
  };
}

/**
 * Rate limiter specifici per diversi tipi di endpoint
 */

// Rate limiter per autenticazione
export const authRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'auth',
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minuti
  blockDurationMs: 30 * 60 * 1000, // 30 minuti
  skipSuccessfulRequests: true,
  onLimitReached: (req) => {
    console.warn(`Auth rate limit reached for ${req.nextUrl.pathname}`);
  },
});

// Rate limiter per production events (QR scanning)
export const productionRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'production',
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minuto
  blockDurationMs: 2 * 60 * 1000, // 2 minuti
  skipSuccessfulRequests: false,
});

// Rate limiter per admin operations
export const adminRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'admin',
  maxAttempts: 30,
  windowMs: 60 * 1000, // 1 minuto
  blockDurationMs: 5 * 60 * 1000, // 5 minuti
  customKeyGenerator: async (req) => {
    // Per admin, usa anche l'header Authorization per identificazione
    const authHeader = req.headers.get('authorization');
    const clientId = await getClientIdentifier(req);
    return `${clientId}:${authHeader ? 'auth' : 'noauth'}`;
  },
});

// Rate limiter per data export/import
export const dataRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'data_ops',
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minuto
  blockDurationMs: 10 * 60 * 1000, // 10 minuti
});

// Rate limiter per workflow operations
export const workflowRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'workflow',
  maxAttempts: 50,
  windowMs: 60 * 1000, // 1 minuto
  blockDurationMs: 3 * 60 * 1000, // 3 minuti
});

// Rate limiter generale per API
export const generalRateLimiter = createRateLimitMiddleware({
  keyPrefix: 'api_general',
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minuto
  blockDurationMs: 5 * 60 * 1000, // 5 minuti
});

/**
 * Helper function per applicare rate limiting a una route handler
 */
export function withRateLimit<T extends NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  rateLimiter: ReturnType<typeof createRateLimitMiddleware>
) {
  return async function (req: T): Promise<NextResponse> {
    return await rateLimiter(req, handler);
  };
}

/**
 * Rate limiting basato su IP + User ID per utenti autenticati
 */
export function createUserBasedRateLimiter(options: RateLimitOptions = {}) {
  return createRateLimitMiddleware({
    ...options,
    customKeyGenerator: async (req) => {
      const clientId = await getClientIdentifier(req);
      
      // Prova a estrarre user ID da session/JWT
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          // Qui andrà logica per decodificare JWT e estrarre user ID
          // Per ora uso client ID standard
          return `user:${clientId}`;
        }
      } catch (error) {
        console.error('Error extracting user ID for rate limiting:', error);
      }
      
      return `anon:${clientId}`;
    },
  });
}

/**
 * Rate limiting progressivo (aumenta restrizioni per abusi ripetuti)
 */
export function createProgressiveRateLimiter(baseOptions: RateLimitOptions = {}) {
  return createRateLimitMiddleware({
    ...baseOptions,
    customKeyGenerator: async (req) => {
      const clientId = await getClientIdentifier(req);
      
      // Controlla storico violazioni
      const violationKey = `violations:${clientId}`;
      const status = await redisRateLimiter.getStatus(clientId, 'violations');
      
      // Calcola moltiplicatore basato su violazioni precedenti
      const violationMultiplier = Math.min(status.totalAttempts + 1, 5);
      
      return `${clientId}:x${violationMultiplier}`;
    },
  });
}

/**
 * Whitelist IP per saltare rate limiting (per sistemi interni)
 */
const INTERNAL_IPS = new Set([
  '127.0.0.1',
  '::1',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
]);

export function createWhitelistedRateLimiter(options: RateLimitOptions = {}) {
  return async function (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Controlla se IP è in whitelist
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers.get('x-real-ip') || 'unknown';
    
    // Se IP è whitelistato, salta rate limiting
    if (INTERNAL_IPS.has(ip) || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return await handler(req);
    }
    
    // Altrimenti applica rate limiting normale
    const rateLimiter = createRateLimitMiddleware(options);
    return await rateLimiter(req, handler);
  };
}

/**
 * Statistiche rate limiting per monitoring
 */
export async function getRateLimitStats() {
  try {
    const stats = redisRateLimiter.getStats();
    
    return {
      service: {
        redisAvailable: stats.redisAvailable,
        fallbackEntriesCount: stats.fallbackEntriesCount,
        isConfigured: stats.isConfigured,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return {
      service: {
        redisAvailable: false,
        fallbackEntriesCount: 0,
        isConfigured: false,
        error: 'Failed to retrieve stats',
      },
      timestamp: new Date().toISOString(),
    };
  }
}