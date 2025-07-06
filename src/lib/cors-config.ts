import { NextRequest, NextResponse } from 'next/server';

/**
 * Configurazione CORS robusta per MES Aerospazio
 * Gestisce cross-origin requests per deployment in ambiente industriale
 */

interface CORSOptions {
  allowedOrigins?: readonly string[];
  allowedMethods?: readonly string[];
  allowedHeaders?: readonly string[];
  exposedHeaders?: readonly string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

const defaultOptions: CORSOptions = {
  allowedOrigins: process.env.NODE_ENV === 'production' 
    ? [
        // Production domains - aggiungere domini effettivi
        'https://mes.mantaaero.com',
        'https://production.mantaaero.com',
        'https://dashboard.mantaaero.com',
      ]
    : [
        // Development domains
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://192.168.1.0/24', // Subnet locale per testing
      ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
    'Cache-Control',
    'Accept',
    'Origin',
    'User-Agent',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
    'X-Request-ID',
    'X-API-Version',
  ],
  credentials: true,
  maxAge: 86400, // 24 ore
  optionsSuccessStatus: 204,
};

/**
 * Verifica se un'origine è permessa
 */
function isOriginAllowed(origin: string | null, allowedOrigins: readonly string[]): boolean {
  if (!origin) return false;
  
  // Controllo esatto
  if (allowedOrigins.includes(origin)) return true;
  
  // Controllo pattern (per subnet IP in development)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('/')) {
      // È un pattern CIDR - logica semplificata per subnet
      const [baseIp] = allowed.split('/');
      if (origin.startsWith(`http://${baseIp.split('.').slice(0, 3).join('.')}.`)) {
        return true;
      }
    }
    
    // Pattern wildcard per subdomain
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      if (origin.endsWith(domain)) return true;
    }
  }
  
  return false;
}

/**
 * Middleware CORS principale
 */
export function corsHandler(options: CORSOptions = {}): (req: NextRequest) => NextResponse | null {
  const config = { ...defaultOptions, ...options };
  
  return function (req: NextRequest): NextResponse | null {
    const origin = req.headers.get('origin');
    const method = req.method;
    
    // Per richieste OPTIONS (preflight)
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: config.optionsSuccessStatus });
      
      // Verifica origine
      if (origin && isOriginAllowed(origin, config.allowedOrigins!)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      // Headers CORS
      response.headers.set('Access-Control-Allow-Methods', config.allowedMethods!.join(', '));
      response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders!.join(', '));
      response.headers.set('Access-Control-Max-Age', config.maxAge!.toString());
      
      if (config.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      // Headers sicurezza aggiuntivi
      response.headers.set('Vary', 'Origin');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      
      return response;
    }
    
    // Per richieste normali, non restituisce response (let passthrough)
    return null;
  };
}

/**
 * Applica headers CORS a una response esistente
 */
export function applyCORSHeaders(
  response: NextResponse, 
  request: NextRequest, 
  options: CORSOptions = {}
): NextResponse {
  const config = { ...defaultOptions, ...options };
  const origin = request.headers.get('origin');
  
  // Applica headers CORS se origine è permessa
  if (origin && isOriginAllowed(origin, config.allowedOrigins!)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    
    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    // Esponi headers utili al client
    if (config.exposedHeaders && config.exposedHeaders.length > 0) {
      response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }
    
    // Headers di sicurezza
    response.headers.set('Vary', 'Origin');
  }
  
  return response;
}

/**
 * Configurazioni CORS predefinite per diversi ambienti
 */
export const corsConfigs = {
  // Configurazione per API pubbliche (molto restrittiva)
  public: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://mes.mantaaero.com']
      : ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 3600, // 1 ora
  },
  
  // Configurazione per dashboard admin (restrittiva)
  admin: {
    allowedOrigins: process.env.NODE_ENV === 'production'
      ? ['https://admin.mantaaero.com', 'https://dashboard.mantaaero.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
    credentials: true,
    maxAge: 1800, // 30 minuti
  },
  
  // Configurazione per API produzione (bilanciata)
  production: {
    allowedOrigins: process.env.NODE_ENV === 'production'
      ? [
          'https://production.mantaaero.com',
          'https://qr-scanner.mantaaero.com',
          'https://mes.mantaaero.com',
        ]
      : ['http://localhost:3000', 'http://192.168.1.0/24'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-QR-Scanner-Version',
      'X-Department-ID',
      'X-Operator-ID',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-Production-Status',
    ],
    credentials: true,
    maxAge: 7200, // 2 ore
  },
  
  // Configurazione per sviluppo (permissiva)
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://192.168.1.0/24',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version',
      'X-Request-ID',
      'Cache-Control',
      'Accept',
      'Origin',
      'User-Agent',
      'X-Admin-Token',
      'X-QR-Scanner-Version',
      'X-Department-ID',
      'X-Operator-ID',
    ],
    credentials: true,
    maxAge: 86400,
  },
} as const;

/**
 * Factory function per creare handler CORS specifici
 */
export function createCORSMiddleware(configName: keyof typeof corsConfigs) {
  return corsHandler(corsConfigs[configName]);
}

/**
 * Helper per validare configurazione CORS
 */
export function validateCORSConfig(config: CORSOptions): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validazioni
  if (config.allowedOrigins && config.allowedOrigins.length === 0) {
    warnings.push('Nessuna origine permessa - tutte le richieste CORS saranno bloccate');
  }
  
  if (config.allowedOrigins && config.allowedOrigins.includes('*')) {
    if (config.credentials) {
      errors.push('Non è possibile usare wildcard "*" con credentials: true');
    }
    warnings.push('Wildcard "*" per origini non è sicuro in produzione');
  }
  
  if (config.maxAge && config.maxAge > 86400) {
    warnings.push('MaxAge > 24 ore potrebbe causare problemi di cache');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (config.allowedOrigins?.some(origin => origin.includes('localhost'))) {
      errors.push('Origini localhost non dovrebbero essere permesse in produzione');
    }
    
    if (config.allowedOrigins?.some(origin => origin.startsWith('http:'))) {
      warnings.push('Origini HTTP non sono sicure in produzione - usa HTTPS');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logging per debug CORS
 */
export function logCORSRequest(req: NextRequest, allowed: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.get('origin');
    const method = req.method;
    const path = req.nextUrl.pathname;
    
    console.log(`CORS: ${method} ${path} from ${origin || 'same-origin'} - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
  }
}

/**
 * Middleware wrapper per applicare CORS automaticamente
 */
export function withCORS<T extends NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  corsConfig?: CORSOptions
) {
  return async function (req: T): Promise<NextResponse> {
    const corsMiddleware = corsHandler(corsConfig);
    
    // Gestisci preflight OPTIONS
    const corsResponse = corsMiddleware(req);
    if (corsResponse) {
      logCORSRequest(req, true);
      return corsResponse;
    }
    
    // Esegui handler normale
    const response = await handler(req);
    
    // Applica headers CORS alla response
    const origin = req.headers.get('origin');
    const allowed = !corsConfig?.allowedOrigins || 
      (origin && isOriginAllowed(origin, corsConfig.allowedOrigins));
    
    logCORSRequest(req, allowed || false);
    
    if (allowed) {
      return applyCORSHeaders(response, req, corsConfig);
    }
    
    return response;
  };
}