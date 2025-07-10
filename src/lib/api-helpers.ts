import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Unified response format for all API endpoints
 */
export interface ApiResponse<T = any> {
  data?: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    [key: string]: any
  }
  success: boolean
  error?: string
  details?: any
}

/**
 * Centralized response helper for consistent API responses
 */
export class ResponseHelper {
  /**
   * Success response with optional pagination metadata
   */
  static success<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      data,
      meta,
      success: true
    })
  }

  /**
   * Paginated success response
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    additionalMeta?: Record<string, any>
  ): NextResponse<ApiResponse<T[]>> {
    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...additionalMeta
      },
      success: true
    })
  }

  /**
   * Error response with consistent structure
   */
  static error(message: string, status: number, details?: any): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message,
      details
    }, { status })
  }

  /**
   * Created response for successful resource creation
   */
  static created<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      data,
      meta,
      success: true
    }, { status: 201 })
  }

  /**
   * No content response for successful operations without data
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  // Common error responses
  static unauthorized(message: string = 'Non autorizzato'): NextResponse<ApiResponse> {
    return this.error(message, 401)
  }

  static forbidden(message: string = 'Permessi insufficienti'): NextResponse<ApiResponse> {
    return this.error(message, 403)
  }

  static notFound(message: string = 'Risorsa non trovata'): NextResponse<ApiResponse> {
    return this.error(message, 404)
  }

  static conflict(message: string = 'Conflitto di dati'): NextResponse<ApiResponse> {
    return this.error(message, 409)
  }

  static validationError(message: string = 'Dati non validi', details?: any): NextResponse<ApiResponse> {
    return this.error(message, 400, details)
  }

  static internalError(message: string = 'Errore interno del server'): NextResponse<ApiResponse> {
    return this.error(message, 500)
  }
}

/**
 * Custom error classes for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Risorsa non trovata') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflitto di dati') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Non autorizzato') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Permessi insufficienti') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * Centralized error handler for consistent error responses
 */
export class ErrorHelper {
  /**
   * Handle different types of errors and return appropriate response
   */
  static handleError(error: unknown): NextResponse<ApiResponse> {
    console.error('API Error:', error)

    // Handle custom API errors
    if (error instanceof ApiError) {
      return ResponseHelper.error(error.message, error.status, error.details)
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return ResponseHelper.validationError('Dati non validi', error.errors)
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; meta?: { target?: string[] } }
      
      switch (dbError.code) {
        case 'P2002': // Unique constraint violation
          return ResponseHelper.conflict('Risorsa già esistente')
        case 'P2025': // Record not found
          return ResponseHelper.notFound('Risorsa non trovata')
        case 'P2003': // Foreign key constraint violation
          return ResponseHelper.conflict('Operazione non consentita: dipendenze esistenti')
        case 'P2016': // Query interpretation error
          return ResponseHelper.validationError('Parametri di query non validi')
        default:
          return ResponseHelper.internalError('Errore database')
      }
    }

    // Handle standard errors
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('already exists')) {
        return ResponseHelper.conflict(error.message)
      }
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(error.message)
      }
      if (error.message.includes('unauthorized')) {
        return ResponseHelper.unauthorized(error.message)
      }
      if (error.message.includes('forbidden')) {
        return ResponseHelper.forbidden(error.message)
      }
      
      return ResponseHelper.internalError(error.message)
    }

    // Fallback for unknown errors
    return ResponseHelper.internalError('Errore sconosciuto')
  }

  /**
   * Wrap async API handlers with error handling
   */
  static withErrorHandling<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      try {
        return await handler(...args)
      } catch (error) {
        return ErrorHelper.handleError(error)
      }
    }
  }
}

/**
 * Query parameter parsing helpers
 */
export class QueryHelper {
  /**
   * Parse pagination parameters from URL search params
   */
  static parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    
    return { page, limit, skip: (page - 1) * limit }
  }

  /**
   * Parse sorting parameters from URL search params
   */
  static parseSorting(searchParams: URLSearchParams, allowedFields: string[], defaultField: string = 'createdAt') {
    const sortBy = allowedFields.includes(searchParams.get('sortBy') || '') 
      ? searchParams.get('sortBy')! 
      : defaultField
    const sortOrder = ['asc', 'desc'].includes(searchParams.get('sortOrder') || '') 
      ? searchParams.get('sortOrder')! 
      : 'desc'
    
    return { sortBy, sortOrder }
  }

  /**
   * Parse all search params from URL
   */
  static parseSearchParams(url: string) {
    const { searchParams } = new URL(url)
    const params: Record<string, string | string[]> = {}
    
    searchParams.forEach((value, key) => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    })
    
    return params
  }
}

/**
 * Authentication helper for consistent auth checks
 */
export class AuthHelper {
  /**
   * Check if user has required roles
   */
  static hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole)
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(userRole: string): boolean {
    return userRole === 'ADMIN'
  }

  /**
   * Check if user has supervisor or higher privileges
   */
  static isSupervisorOrHigher(userRole: string): boolean {
    return ['ADMIN', 'SUPERVISOR'].includes(userRole)
  }

  /**
   * Check if user can modify resource (admin/supervisor only)
   */
  static canModify(userRole: string): boolean {
    return this.isSupervisorOrHigher(userRole)
  }
}