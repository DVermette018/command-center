/**
 * Custom error classes for Anthropic service
 * Provides structured error handling with categorization and retry logic
 */

import { AnthropicErrorType, type AnthropicErrorDetails } from '../../types/anthropic'

/**
 * Base error class for all Anthropic service errors
 */
export abstract class AnthropicServiceError extends Error {
  public readonly type: AnthropicErrorType
  public readonly retryable: boolean
  public readonly statusCode?: number
  public readonly context: Record<string, unknown>
  public readonly timestamp: Date
  public readonly originalError?: Error

  constructor(
    type: AnthropicErrorType,
    message: string,
    options: {
      retryable?: boolean
      statusCode?: number
      context?: Record<string, unknown>
      originalError?: Error
    } = {}
  ) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.retryable = options.retryable ?? false
    this.statusCode = options.statusCode
    this.context = options.context ?? {}
    this.timestamp = new Date()
    this.originalError = options.originalError

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Convert error to structured details format
   */
  toDetails(): AnthropicErrorDetails {
    return {
      type: this.type,
      message: this.message,
      originalError: this.originalError,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp
    }
  }

  /**
   * Get error details for logging
   */
  toLogContext(): Record<string, unknown> {
    return {
      errorType: this.type,
      errorMessage: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      originalError: this.originalError?.message
    }
  }
}

/**
 * Authentication and authorization errors
 */
export class AnthropicAuthenticationError extends AnthropicServiceError {
  constructor(message: string, originalError?: Error) {
    super(AnthropicErrorType.AUTHENTICATION, message, {
      retryable: false,
      statusCode: 401,
      originalError
    })
  }
}

/**
 * Rate limiting errors
 */
export class AnthropicRateLimitError extends AnthropicServiceError {
  public readonly retryAfter?: number

  constructor(message: string, retryAfter?: number, originalError?: Error) {
    super(AnthropicErrorType.RATE_LIMIT, message, {
      retryable: true,
      statusCode: 429,
      context: { retryAfter },
      originalError
    })
    this.retryAfter = retryAfter
  }
}

/**
 * Network connectivity errors
 */
export class AnthropicNetworkError extends AnthropicServiceError {
  constructor(message: string, originalError?: Error) {
    super(AnthropicErrorType.NETWORK, message, {
      retryable: true,
      originalError
    })
  }
}

/**
 * Request timeout errors
 */
export class AnthropicTimeoutError extends AnthropicServiceError {
  public readonly timeoutMs: number

  constructor(message: string, timeoutMs: number, originalError?: Error) {
    super(AnthropicErrorType.TIMEOUT, message, {
      retryable: true,
      context: { timeoutMs },
      originalError
    })
    this.timeoutMs = timeoutMs
  }
}

/**
 * Request validation errors
 */
export class AnthropicValidationError extends AnthropicServiceError {
  public readonly validationErrors: string[]

  constructor(message: string, validationErrors: string[] = [], originalError?: Error) {
    super(AnthropicErrorType.VALIDATION, message, {
      retryable: false,
      statusCode: 400,
      context: { validationErrors },
      originalError
    })
    this.validationErrors = validationErrors
  }
}

/**
 * Anthropic API server errors
 */
export class AnthropicApiError extends AnthropicServiceError {
  constructor(message: string, statusCode: number, originalError?: Error) {
    super(AnthropicErrorType.API_ERROR, message, {
      retryable: statusCode >= 500, // Server errors are retryable, client errors are not
      statusCode,
      originalError
    })
  }
}

/**
 * Service configuration errors
 */
export class AnthropicConfigurationError extends AnthropicServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AnthropicErrorType.CONFIGURATION, message, {
      retryable: false,
      context
    })
  }
}

/**
 * Circuit breaker errors
 */
export class AnthropicCircuitBreakerError extends AnthropicServiceError {
  public readonly nextAttemptTime: Date

  constructor(message: string, nextAttemptTime: Date) {
    super(AnthropicErrorType.CIRCUIT_BREAKER, message, {
      retryable: false, // Circuit breaker errors should not be retried immediately
      context: { nextAttemptTime: nextAttemptTime.toISOString() }
    })
    this.nextAttemptTime = nextAttemptTime
  }
}

/**
 * Unknown or unexpected errors
 */
export class AnthropicUnknownError extends AnthropicServiceError {
  constructor(message: string, originalError?: Error) {
    super(AnthropicErrorType.UNKNOWN, message, {
      retryable: false,
      originalError
    })
  }
}

/**
 * Error factory to create appropriate error instances from various input types
 */
export class AnthropicErrorFactory {
  /**
   * Create structured error from unknown input
   */
  static fromUnknown(error: unknown, defaultMessage = 'Unknown error occurred'): AnthropicServiceError {
    // Handle existing AnthropicServiceError instances
    if (error instanceof AnthropicServiceError) {
      return error
    }

    // Handle standard Error instances
    if (error instanceof Error) {
      return this.fromError(error)
    }

    // Handle Anthropic API error objects
    if (this.isAnthropicApiError(error)) {
      return this.fromApiError(error)
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new AnthropicUnknownError(error)
    }

    // Handle unknown error types
    return new AnthropicUnknownError(
      defaultMessage,
      error instanceof Error ? error : new Error(String(error))
    )
  }

  /**
   * Create structured error from Error instance
   */
  static fromError(error: Error): AnthropicServiceError {
    const message = error.message.toLowerCase()

    // Timeout errors
    if (message.includes('timeout') || message.includes('etimedout')) {
      return new AnthropicTimeoutError(error.message, 30000, error)
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('econnreset')
    ) {
      return new AnthropicNetworkError(error.message, error)
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('api key')) {
      return new AnthropicAuthenticationError(error.message, error)
    }

    // Default to unknown error
    return new AnthropicUnknownError(error.message, error)
  }

  /**
   * Create structured error from Anthropic API error response
   */
  static fromApiError(apiError: { status?: number; message?: string; type?: string; error?: any }): AnthropicServiceError {
    const message = apiError.message || apiError.error?.message || 'API error occurred'
    const status = apiError.status || apiError.error?.status

    // Handle specific status codes
    switch (status) {
      case 401:
      case 403:
        return new AnthropicAuthenticationError(message, apiError as any)
      
      case 429:
        // Extract retry-after if available
        const retryAfter = apiError.error?.headers?.['retry-after']
        return new AnthropicRateLimitError(message, retryAfter, apiError as any)
      
      case 400:
        return new AnthropicValidationError(message, [], apiError as any)
      
      case 404:
        return new AnthropicConfigurationError(`API endpoint not found: ${message}`)
      
      default:
        return new AnthropicApiError(message, status || 500, apiError as any)
    }
  }

  /**
   * Type guard for Anthropic API error objects
   */
  private static isAnthropicApiError(error: unknown): error is { status?: number; message?: string; type?: string; error?: any } {
    return (
      typeof error === 'object' &&
      error !== null &&
      (('status' in error && typeof (error as any).status === 'number') ||
       ('message' in error && typeof (error as any).message === 'string') ||
       ('type' in error && typeof (error as any).type === 'string'))
    )
  }
}