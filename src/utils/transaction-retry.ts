/**
 * Utility per gestire retry automatici delle transazioni in caso di race conditions
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: Error) => boolean
}

export class TransactionRetryHelper {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error: Error) => {
      // Retry su errori di concorrenza comuni
      const message = error.message.toLowerCase()
      return (
        message.includes('modified by another operation') ||
        message.includes('unique constraint') ||
        message.includes('deadlock') ||
        message.includes('lock wait timeout') ||
        message.includes('serialization failure') ||
        // Prisma specific errors
        error.message.includes('P2034') || // Transaction failed due to conflict
        error.message.includes('P2002')    // Unique constraint failed
      )
    }
  }

  /**
   * Esegue una funzione con retry automatico in caso di race condition
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options }
    let lastError: Error
    let delay = config.initialDelay

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Se non è l'ultimo tentativo e l'errore è ritentabile
        if (attempt < config.maxRetries && config.retryCondition(lastError)) {
          console.warn(`Transaction failed on attempt ${attempt + 1}/${config.maxRetries + 1}: ${lastError.message}`)
          
          // Attendi prima del retry con backoff esponenziale
          await this.sleep(delay)
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
          
          continue
        }
        
        // Se è l'ultimo tentativo o l'errore non è ritentabile, rilancia
        throw lastError
      }
    }

    throw lastError!
  }

  /**
   * Utility per attendere un determinato numero di millisecondi
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Verifica se un errore è causato da race condition
   */
  static isRaceConditionError(error: Error): boolean {
    return this.DEFAULT_OPTIONS.retryCondition(error)
  }

  /**
   * Wrapper specifico per operazioni Prisma con retry
   */
  static async executePrismaWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Prisma operation'
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      maxRetries: 3,
      initialDelay: 50,
      maxDelay: 500,
      retryCondition: (error) => {
        const isPrismaError = error.message.includes('P20') // Prisma error codes
        const isRaceCondition = this.DEFAULT_OPTIONS.retryCondition(error)
        
        if (isPrismaError || isRaceCondition) {
          console.warn(`${operationName} encountered retryable error:`, error.message)
          return true
        }
        
        return false
      }
    })
  }
}

/**
 * Decorator per metodi che richiedono retry automatico
 */
export function withRetry(options: RetryOptions = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: any, ...args: any[]) {
      return TransactionRetryHelper.executeWithRetry(
        () => originalMethod.apply(this, args),
        options
      )
    } as T

    return descriptor
  }
}

/**
 * Helper specifico per operazioni ODL con race condition protection
 */
export class ODLConcurrencyHelper {
  /**
   * Aggiorna un ODL con protezione contro race conditions
   */
  static async updateWithConcurrencyCheck<T>(
    operation: () => Promise<T>,
    entityName: string = 'ODL'
  ): Promise<T> {
    return TransactionRetryHelper.executeWithRetry(operation, {
      maxRetries: 2, // Meno tentativi per operazioni utente
      initialDelay: 100,
      maxDelay: 300,
      retryCondition: (error) => {
        const message = error.message.toLowerCase()
        const isRetryable = (
          message.includes('modified by another operation') ||
          message.includes('has been updated') ||
          message.includes('concurrent modification')
        )
        
        if (isRetryable) {
          console.info(`${entityName} update conflict detected, retrying...`)
        }
        
        return isRetryable
      }
    })
  }

  /**
   * Verifica optimistic locking su timestamp
   */
  static checkOptimisticLock(
    currentTimestamp: Date,
    expectedTimestamp: Date,
    entityName: string = 'Entity'
  ): void {
    if (currentTimestamp.getTime() !== expectedTimestamp.getTime()) {
      throw new Error(
        `${entityName} has been modified by another operation. Current: ${currentTimestamp.toISOString()}, Expected: ${expectedTimestamp.toISOString()}`
      )
    }
  }
}