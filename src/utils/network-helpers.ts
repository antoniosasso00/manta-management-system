/**
 * Utility per gestione robusta della connettività di rete e retry logic
 * per il sistema QR del MES Aerospazio
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
}

export interface ConnectivityCheckOptions {
  timeout?: number;
  endpoint?: string;
}

/**
 * Implementa retry logic con exponential backoff
 */
export class RetryManager {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryCondition: (error: any) => {
      // Retry su errori di rete, timeout, server temporaneamente non disponibile
      return (
        error?.name === 'NetworkError' ||
        error?.name === 'TimeoutError' ||
        error?.code === 'NETWORK_ERROR' ||
        (error?.status >= 500 && error?.status < 600) || // Server errors
        error?.status === 408 || // Request timeout
        error?.status === 429 || // Too many requests
        error?.status === 503    // Service unavailable
      );
    }
  };

  /**
   * Esegue una funzione con retry automatico e exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Se è l'ultimo tentativo o l'errore non è retryable, rilancia
        if (attempt === opts.maxRetries || !opts.retryCondition(error)) {
          throw error;
        }

        // Calcola delay con exponential backoff e jitter
        const baseDelay = Math.min(
          opts.baseDelay * Math.pow(2, attempt),
          opts.maxDelay
        );
        
        // Aggiunge jitter (±25%) per evitare thundering herd
        const jitter = baseDelay * 0.25 * (Math.random() - 0.5);
        const delay = Math.max(0, baseDelay + jitter);

        console.warn(
          `[RetryManager] Tentativo ${attempt + 1}/${opts.maxRetries + 1} fallito, retry tra ${Math.round(delay)}ms`,
          { error: this.sanitizeError(error) }
        );

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Delay asincrono
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sanitizza errore per logging sicuro
   */
  private static sanitizeError(error: any): any {
    return {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Gestisce test di connettività effettiva alle API
 */
export class ConnectivityChecker {
  private static readonly DEFAULT_OPTIONS: Required<ConnectivityCheckOptions> = {
    timeout: 5000,
    endpoint: '/api/health'
  };

  private static lastCheckTime = 0;
  private static lastCheckResult = false;
  private static readonly CACHE_DURATION = 30000; // 30 secondi

  /**
   * Testa la connettività effettiva alle API
   */
  static async checkConnectivity(
    options: ConnectivityCheckOptions = {}
  ): Promise<boolean> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const now = Date.now();

    // Usa cache se il check è recente
    if (now - this.lastCheckTime < this.CACHE_DURATION) {
      return this.lastCheckResult;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const response = await fetch(opts.endpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      this.lastCheckTime = now;
      this.lastCheckResult = response.ok;
      
      return response.ok;
    } catch (error) {
      console.warn('[ConnectivityChecker] Test connettività fallito:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: opts.endpoint
      });

      this.lastCheckTime = now;
      this.lastCheckResult = false;
      
      return false;
    }
  }

  /**
   * Combina navigator.onLine con test effettivo API
   */
  static async isEffectivelyOnline(
    options: ConnectivityCheckOptions = {}
  ): Promise<boolean> {
    // Se navigator dice offline, non serve testare API
    if (!navigator.onLine) {
      return false;
    }

    // Se navigator dice online, verifica con API
    return await this.checkConnectivity(options);
  }

  /**
   * Resetta la cache del connectivity check
   */
  static resetCache(): void {
    this.lastCheckTime = 0;
    this.lastCheckResult = false;
  }

  /**
   * Hook per monitoraggio continuo connettività
   */
  static startMonitoring(
    callback: (isOnline: boolean) => void,
    intervalMs = 60000 // 1 minuto
  ): () => void {
    let isActive = true;
    
    const check = async () => {
      if (!isActive) return;
      
      const isOnline = await this.isEffectivelyOnline();
      callback(isOnline);
      
      if (isActive) {
        setTimeout(check, intervalMs);
      }
    };

    // Primo check immediato
    check();

    // Event listeners per cambiamenti di stato
    const handleOnline = () => {
      if (isActive) {
        // Quando torna online, testa immediatamente
        setTimeout(() => check(), 1000);
      }
    };

    const handleOffline = () => {
      if (isActive) {
        callback(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Funzione di cleanup
    return () => {
      isActive = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

/**
 * Utility per gestione errori fetch con informazioni dettagliate
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }

  static fromFetchError(error: any, response?: Response): NetworkError {
    if (response) {
      return new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'HTTP_ERROR',
        error
      );
    }

    if (error.name === 'AbortError') {
      return new NetworkError(
        'Request timeout',
        408,
        'TIMEOUT_ERROR',
        error
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError(
        'Network connection failed',
        0,
        'NETWORK_ERROR',
        error
      );
    }

    return new NetworkError(
      error.message || 'Unknown network error',
      0,
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Wrapper fetch con retry automatico e gestione errori migliorata
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return RetryManager.withRetry(async () => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw NetworkError.fromFetchError(null, response);
      }
      
      return response;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      
      throw NetworkError.fromFetchError(error);
    }
  }, retryOptions);
}