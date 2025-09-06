import type { TRPCError } from '@trpc/server'
import type { ErrorClassification } from '~~/types/error'

/**
 * Utility functions for error handling
 */

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const isNetworkError = (error: Error): boolean => {
  return error.name === 'NetworkError' || 
         error.message.includes('fetch failed') ||
         error.message.includes('Network Error') ||
         error.message.includes('ERR_NETWORK') ||
         error.message.includes('ERR_INTERNET_DISCONNECTED')
}

export const isTimeoutError = (error: Error): boolean => {
  return error.name === 'TimeoutError' ||
         error.message.includes('timeout') ||
         error.message.includes('Request timeout')
}

export const isTRPCError = (error: any): error is TRPCError => {
  return error && typeof error === 'object' && (
    // Server-side TRPCError (has code property directly)
    'code' in error ||
    // Client-side TRPC error (has data.code structure)
    ('data' in error && error.data && 'code' in error.data)
  )
}

export const classifyError = (error: Error | TRPCError): ErrorClassification => {
  // Network errors
  if (isNetworkError(error)) {
    return {
      type: 'network',
      isRetryable: true,
      severity: 'medium'
    }
  }

  // Timeout errors
  if (isTimeoutError(error)) {
    return {
      type: 'timeout',
      isRetryable: true,
      severity: 'medium'
    }
  }

  // TRPC errors
  if (isTRPCError(error)) {
    // Handle both server-side and client-side TRPC errors
    const code = 'code' in error ? error.code : error.data?.code
    const httpStatus = 'data' in error ? error.data?.httpStatus || 500 : 500

    // Classify by TRPC code
    if (['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'METHOD_NOT_SUPPORTED', 'UNPROCESSABLE_CONTENT'].includes(code)) {
      return {
        type: 'client',
        code,
        isRetryable: code === 'REQUEST_TIMEOUT' || code === 'TOO_MANY_REQUESTS',
        severity: code === 'UNAUTHORIZED' || code === 'FORBIDDEN' ? 'high' : 'low'
      }
    }

    // Server errors
    if (['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'].includes(code)) {
      return {
        type: 'server',
        code,
        isRetryable: true,
        severity: code === 'INTERNAL_SERVER_ERROR' ? 'high' : 'medium'
      }
    }

    // Timeout and rate limiting
    if (['REQUEST_TIMEOUT', 'TOO_MANY_REQUESTS'].includes(code)) {
      return {
        type: code === 'REQUEST_TIMEOUT' ? 'timeout' : 'client',
        code,
        isRetryable: true,
        severity: 'medium'
      }
    }

    // Conflict errors
    if (code === 'CONFLICT') {
      return {
        type: 'client',
        code,
        isRetryable: false,
        severity: 'medium'
      }
    }

    // Fallback for TRPC errors we don't specifically handle
    return {
      type: httpStatus >= 500 ? 'server' : 'client',
      code,
      isRetryable: httpStatus >= 500,
      severity: 'medium'
    }
  }

  // Unknown errors
  return {
    type: 'unknown',
    isRetryable: false,
    severity: 'medium'
  }
}

export const getErrorMessage = (error: Error | TRPCError, context?: string, isDevelopment = false): string => {
  // Development mode - show detailed errors
  if (isDevelopment) {
    return error.message || 'Unknown error occurred'
  }

  // TRPC errors with user-friendly messages
  if (isTRPCError(error)) {
    const code = 'code' in error ? error.code : error.data?.code

    switch (code) {
      case 'BAD_REQUEST':
        return error.message || 'Invalid request data'
      case 'UNAUTHORIZED':
        return 'Please log in to continue'
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action'
      case 'NOT_FOUND':
        return 'The requested item was not found'
      case 'CONFLICT':
        return 'This item has been modified by another user'
      case 'TOO_MANY_REQUESTS':
        return 'Too many requests. Please try again in a moment'
      case 'INTERNAL_SERVER_ERROR':
        return 'Something went wrong. Please try again.'
      case 'SERVICE_UNAVAILABLE':
        return 'Service is temporarily unavailable'
      default:
        return error.message || 'An unexpected error occurred'
    }
  }

  // Network and timeout errors
  if (isNetworkError(error)) {
    return 'Please check your internet connection'
  }

  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again'
  }

  // Generic fallback
  return 'Something went wrong. Please try again'
}

export const getErrorTitle = (error: Error | TRPCError, context?: string): string => {
  if (isTRPCError(error)) {
    const code = 'code' in error ? error.code : error.data?.code

    switch (code) {
      case 'BAD_REQUEST':
        return (context === 'form-submission' || context === 'form-validation') ? 'Validation Error' : 'Request Error'
      case 'UNAUTHORIZED':
        return 'Authentication Required'
      case 'FORBIDDEN':
        return 'Access Denied'
      case 'NOT_FOUND':
        return 'Not Found'
      case 'CONFLICT':
        return 'Conflict Detected'
      case 'TOO_MANY_REQUESTS':
        return 'Rate Limited'
      case 'INTERNAL_SERVER_ERROR':
        return 'Server Error'
      case 'SERVICE_UNAVAILABLE':
        return 'Service Unavailable'
      default:
        return 'Error'
    }
  }

  if (isNetworkError(error)) {
    return 'Connection Error'
  }

  if (isTimeoutError(error)) {
    return 'Timeout Error'
  }

  return 'Error'
}

export const shouldShowErrorToUser = (error: Error | TRPCError, context?: string): boolean => {
  // Don't show errors for background operations unless they're critical
  if (context === 'background-sync') {
    const classification = classifyError(error)
    return classification.severity === 'critical'
  }

  // Always show user-facing errors
  return true
}

export const getRetryDelay = (attempt: number, baseDelay = 1000, maxDelay = 30000): number => {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.floor(exponentialDelay + jitter)
}

export const createErrorId = (error: Error | TRPCError): string => {
  const timestamp = Date.now()
  const errorType = isTRPCError(error) ? ('code' in error ? error.code : error.data?.code) : error.name
  const hash = btoa(error.message).substring(0, 8)
  return `${errorType}_${hash}_${timestamp}`
}

export const sanitizeErrorForLogging = (error: Error | TRPCError): Record<string, any> => {
  const sanitized: Record<string, any> = {
    message: error.message,
    name: error.name,
    timestamp: new Date().toISOString()
  }

  if (isTRPCError(error)) {
    sanitized.trpcCode = 'code' in error ? error.code : error.data?.code
    sanitized.httpStatus = 'data' in error ? error.data?.httpStatus : undefined
  }

  if (error.stack && process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack
  }

  return sanitized
}