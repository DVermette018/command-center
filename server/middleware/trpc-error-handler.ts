import { TRPCError } from '@trpc/server'
import type { 
  ErrorClassification, 
  ErrorContext, 
  RetryConfig, 
  ErrorHandlerOptions,
  ErrorAnalytics,
  ErrorRecoveryAction,
  ErrorPattern
} from '~~/types/error'

/**
 * TRPC Error Handler Middleware for Server-side Error Processing
 * 
 * This middleware provides comprehensive error handling including:
 * - Error classification and user-friendly messaging
 * - Retry logic with exponential backoff
 * - Cache invalidation strategies
 * - Context-aware error handling
 * - Analytics tracking
 */
export class TRPCErrorHandler {
  private errorPatterns: ErrorPattern = {}
  private analyticsHandler?: (data: ErrorAnalytics) => void
  private toast?: any
  private queryClient?: any

  constructor(options: ErrorHandlerOptions = {}) {
    this.toast = options.toast
    this.queryClient = options.queryClient
  }

  /**
   * Classifies errors based on type and determines retry behavior
   */
  classifyError(error: Error | TRPCError): ErrorClassification {
    // Handle TRPC errors
    if (error instanceof TRPCError) {
      const code = error.code
      
      // Client errors (4xx equivalent)
      if (['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'METHOD_NOT_SUPPORTED', 'UNPROCESSABLE_CONTENT'].includes(code)) {
        return {
          type: 'client',
          code,
          isRetryable: code === 'REQUEST_TIMEOUT' || code === 'TOO_MANY_REQUESTS',
          severity: code === 'UNAUTHORIZED' || code === 'FORBIDDEN' ? 'high' : 'medium'
        }
      }
      
      // Server errors (5xx equivalent)
      if (['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'].includes(code)) {
        return {
          type: 'server',
          code,
          isRetryable: true,
          severity: code === 'INTERNAL_SERVER_ERROR' ? 'critical' : 'high'
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
    }

    // Handle network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch failed')) {
      return {
        type: 'network',
        isRetryable: true,
        severity: 'medium'
      }
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        type: 'timeout',
        isRetryable: true,
        severity: 'medium'
      }
    }

    // Default unknown error
    return {
      type: 'unknown',
      isRetryable: false,
      severity: 'high'
    }
  }

  /**
   * Handles errors with appropriate user feedback and recovery actions
   */
  async handleError(error: Error | TRPCError, context: ErrorContext): Promise<void> {
    const classification = this.classifyError(error)
    
    // Track error for analytics
    this.trackError(error)

    // Send analytics if handler is set
    if (this.analyticsHandler) {
      this.analyticsHandler({
        event: 'trpc_error',
        errorCode: classification.code,
        errorType: classification.type,
        context: context.context,
        userId: context.userId,
        isRetryable: classification.isRetryable,
        timestamp: new Date()
      })
    }

    // Handle silent errors (background operations)
    if (context.silent) {
      console.warn('Silent error handled:', error.message)
      return
    }

    // Handle cache invalidation
    await this.handleCacheInvalidation(error, context)

    // Handle specific error types
    if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
      await this.handleUnauthorizedError(context)
      return
    }

    // Show appropriate user notification
    await this.showUserNotification(error, classification, context)
  }

  /**
   * Shows user-friendly notifications based on error type and context
   */
  private async showUserNotification(
    error: Error | TRPCError, 
    classification: ErrorClassification, 
    context: ErrorContext
  ): Promise<void> {
    if (!this.toast) return

    const isDevelopment = process.env.NODE_ENV === 'development'
    let notification: any = {}

    switch (classification.type) {
      case 'client':
        if (error instanceof TRPCError) {
          if (error.code === 'BAD_REQUEST' && (context.context === 'form-validation' || context.context === 'form-submission')) {
            notification = {
              title: 'Validation Error',
              description: error.message,
              color: 'red',
              timeout: 5000
            }
          } else if (error.code === 'CONFLICT') {
            notification = {
              title: 'Conflict Error',
              description: 'The resource has been modified. Please refresh and try again.',
              color: 'orange',
              timeout: 6000,
              actions: this.getConflictActions(context)
            }
          } else if (error.code === 'TOO_MANY_REQUESTS') {
            notification = {
              title: 'Rate Limit Exceeded',
              description: context.suggestAlternatives 
                ? 'You\'ve made too many requests. Please try again later or reduce batch size.'
                : 'You\'ve made too many requests. Please try again later.',
              color: 'yellow',
              timeout: 8000,
              actions: context.suggestAlternatives ? [
                { label: 'Reduce Batch Size', click: () => {} }
              ] : [{
                label: 'Retry',
                click: () => this.handleRetry(context)
              }]
            }
          } else {
            const title = context.context === 'form-submission' ? 'Validation Error' : 'Request Error'
            notification = {
              title,
              description: isDevelopment ? error.message : 'Please check your input and try again.',
              color: 'red',
              timeout: 5000
            }
          }
        }
        break

      case 'server':
        notification = {
          title: 'Server Error',
          description: isDevelopment && error.message 
            ? error.message 
            : 'Something went wrong. Please try again.',
          color: 'red',
          timeout: 5000,
          actions: classification.isRetryable ? [{
            label: 'Retry',
            click: () => this.handleRetry(context)
          }] : undefined
        }
        break

      case 'network':
        notification = {
          title: 'Connection Error',
          description: 'Please check your internet connection',
          color: 'orange',
          timeout: 8000,
          actions: [{
            label: 'Retry',
            click: () => this.handleRetry(context)
          }]
        }
        break

      case 'timeout':
        notification = {
          title: 'Request Timeout',
          description: 'The request took too long. Please try again.',
          color: 'yellow',
          timeout: 6000,
          actions: [{
            label: 'Retry',
            click: () => this.handleRetry(context)
          }]
        }
        break

      default:
        notification = {
          title: 'Unexpected Error',
          description: isDevelopment ? error.message : 'An unexpected error occurred.',
          color: 'red',
          timeout: 5000
        }
    }

    this.toast.add(notification)
  }

  /**
   * Handles unauthorized errors by redirecting to login
   */
  private async handleUnauthorizedError(context: ErrorContext): Promise<void> {
    if (this.toast) {
      this.toast.add({
        title: 'Authentication Required',
        description: 'Please log in to continue',
        color: 'blue',
        timeout: 3000
      })
    }

    // In server context, we can't directly navigate
    // The client should handle this redirect
    if (typeof navigateTo !== 'undefined') {
      await navigateTo('/auth/login')
    }
  }

  /**
   * Gets recovery actions for conflict errors
   */
  private getConflictActions(context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [
      {
        label: 'Refresh and Retry',
        click: () => {
          if (this.queryClient && context.queryKeys) {
            context.queryKeys.forEach(key => {
              this.queryClient.invalidateQueries({ queryKey: [key] })
            })
          }
        }
      }
    ]

    if (context.resourceType) {
      actions.push({
        label: 'View Changes',
        click: () => {
          // Implementation would depend on the specific resource type
        }
      })
    }

    return actions
  }

  /**
   * Handles cache invalidation based on error type and context
   */
  private async handleCacheInvalidation(error: Error | TRPCError, context: ErrorContext): Promise<void> {
    if (!this.queryClient) return

    const classification = this.classifyError(error)

    // Invalidate queries on server errors to refresh stale data
    if (classification.type === 'server' && context.queryKeys) {
      for (const queryKey of context.queryKeys) {
        await this.queryClient.invalidateQueries({ queryKey: [queryKey] })
      }
    }

    // Remove stale queries on network errors
    if (classification.type === 'network' && context.removeStaleQueries) {
      await this.queryClient.removeQueries({ stale: true })
    }

    // Handle optimistic updates
    if (!classification.isRetryable && context.optimisticData && !context.preserveOptimistic) {
      // Rollback optimistic updates for non-retryable errors
      if (context.queryKeys) {
        for (const queryKey of context.queryKeys) {
          this.queryClient.setQueryData([queryKey], undefined)
        }
      }
    }
  }

  /**
   * Handles retry logic (placeholder for client-side implementation)
   */
  private handleRetry(context: ErrorContext): void {
    // This would be implemented on the client side
    console.log('Retry requested for context:', context.context)
  }

  /**
   * Implements exponential backoff retry logic
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    config: RetryConfig = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
  ): Promise<T> {
    const { maxRetries, baseDelay = 1000, maxDelay = 10000, exponentialBase = 2 } = config
    
    let lastError: Error | TRPCError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error | TRPCError
        
        // Don't retry non-retryable errors
        const classification = this.classifyError(lastError)
        if (!classification.isRetryable) {
          throw lastError
        }
        
        // Don't retry on final attempt
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(exponentialBase, attempt),
          maxDelay
        )
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * delay * 0.1
        
        await new Promise(resolve => setTimeout(resolve, jitteredDelay))
      }
    }
    
    throw lastError!
  }

  /**
   * Tracks error patterns for analytics
   */
  trackError(error: Error | TRPCError): void {
    const classification = this.classifyError(error)
    const key = classification.code || classification.type
    this.errorPatterns[key] = (this.errorPatterns[key] || 0) + 1
  }

  /**
   * Gets aggregated error patterns
   */
  getErrorPatterns(): ErrorPattern {
    return { ...this.errorPatterns }
  }

  /**
   * Sets analytics handler for error tracking
   */
  setAnalyticsHandler(handler: (data: ErrorAnalytics) => void): void {
    this.analyticsHandler = handler
  }

  /**
   * Resets error patterns (useful for testing)
   */
  resetPatterns(): void {
    this.errorPatterns = {}
  }
}

/**
 * Factory function to create TRPC error handler instance
 */
export function createTRPCErrorHandler(options: ErrorHandlerOptions = {}) {
  return new TRPCErrorHandler(options)
}

/**
 * TRPC middleware function for server-side error handling
 */
export function createTRPCErrorMiddleware() {
  const errorHandler = new TRPCErrorHandler()

  return async function errorMiddleware(opts: any) {
    try {
      return await opts.next()
    } catch (error) {
      const classification = errorHandler.classifyError(error as Error | TRPCError)
      
      // Log error on server
      console.error(`TRPC Error [${classification.type}]:`, error)
      
      // Track error
      errorHandler.trackError(error as Error | TRPCError)
      
      // Transform error for client if needed
      if (error instanceof TRPCError) {
        // Don't expose internal server errors in production
        if (process.env.NODE_ENV === 'production' && classification.type === 'server') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An internal error occurred'
          })
        }
      }
      
      // Re-throw the error to maintain TRPC error handling flow
      throw error
    }
  }
}