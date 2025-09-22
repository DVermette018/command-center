/**
 * Comprehensive TypeScript types for Anthropic service integration
 * Provides type safety for Claude API interactions, error handling, and service configuration
 */

import type { MessageParam, Model } from '@anthropic-ai/sdk/resources/messages'

/**
 * Configuration options for the Anthropic service
 */
export interface AnthropicServiceConfig {
  /** Anthropic API key */
  apiKey: string
  /** Maximum tokens to generate in response */
  maxTokens?: number
  /** Claude model to use */
  model?: Model
  /** Request timeout in milliseconds */
  timeout?: number
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Base delay between retries in milliseconds */
  retryDelayMs?: number
  /** Maximum delay between retries in milliseconds */
  maxRetryDelayMs?: number
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number
  /** Circuit breaker reset timeout in milliseconds */
  circuitBreakerResetTimeoutMs?: number
}

/**
 * Parameters for prompt enhancement requests
 */
export interface PromptEnhancementParams {
  /** Original prompt to enhance */
  originalPrompt: string
  /** Additional context for enhancement */
  context?: PromptContext
  /** Enhancement options */
  options?: PromptEnhancementOptions
}

/**
 * Context information for prompt enhancement
 */
export interface PromptContext {
  /** User's industry or domain */
  industry?: string
  /** Project type or category */
  projectType?: string
  /** Timeline requirements */
  timeline?: string
  /** Budget constraints */
  budget?: string
  /** Target audience */
  audience?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Options for controlling prompt enhancement behavior
 */
export interface PromptEnhancementOptions {
  /** Desired enhancement style */
  style?: 'professional' | 'creative' | 'technical' | 'casual'
  /** Focus areas for enhancement */
  focus?: ('clarity' | 'detail' | 'structure' | 'creativity')[]
  /** Maximum length of enhanced prompt */
  maxLength?: number
  /** Include examples in enhancement */
  includeExamples?: boolean
  /** Custom enhancement instructions */
  customInstructions?: string
}

/**
 * Response from prompt enhancement
 */
export interface PromptEnhancementResponse {
  /** Enhanced prompt text */
  enhancedPrompt: string
  /** Confidence score (0-1) */
  confidence: number
  /** Enhancement metadata */
  metadata: {
    /** Original prompt length */
    originalLength: number
    /** Enhanced prompt length */
    enhancedLength: number
    /** Processing time in milliseconds */
    processingTimeMs: number
    /** Model used for enhancement */
    modelUsed: string
    /** Token usage information */
    tokenUsage: {
      input: number
      output: number
      total: number
    }
  }
  /** Suggested improvements or notes */
  suggestions?: string[]
}

/**
 * Error categories for Anthropic service operations
 */
export enum AnthropicErrorType {
  /** API authentication or authorization errors */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Rate limiting errors */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Network connectivity issues */
  NETWORK = 'NETWORK',
  /** Request timeout errors */
  TIMEOUT = 'TIMEOUT',
  /** Invalid request parameters */
  VALIDATION = 'VALIDATION',
  /** Anthropic API server errors */
  API_ERROR = 'API_ERROR',
  /** Service configuration errors */
  CONFIGURATION = 'CONFIGURATION',
  /** Circuit breaker open */
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  /** Unknown or unexpected errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured error information for Anthropic service
 */
export interface AnthropicErrorDetails {
    /** Error type classification */
  type: AnthropicErrorType
  /** Human-readable error message */
  message: string
  /** Original error from API or underlying system */
  originalError?: Error
  /** HTTP status code if applicable */
  statusCode?: number
  /** Whether this error is retryable */
  retryable: boolean
  /** Additional context for debugging */
  context?: Record<string, unknown>
  /** Timestamp when error occurred */
  timestamp: Date
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Base delay between retries in milliseconds */
  baseDelayMs: number
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
  /** Jitter factor to randomize delays (0-1) */
  jitterFactor: number
  /** Function to determine if error is retryable */
  retryCondition?: (error: AnthropicErrorDetails) => boolean
}

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /** Current state of the circuit breaker */
  state: CircuitBreakerState
  /** Number of consecutive failures */
  failureCount: number
  /** Number of successful calls */
  successCount: number
  /** Total number of calls attempted */
  totalCalls: number
  /** Timestamp of last failure */
  lastFailureTime?: Date
  /** Next allowed attempt time when open */
  nextAttemptTime?: Date
}

/**
 * Service health check result
 */
export interface HealthCheckResult {
  /** Whether the service is healthy */
  healthy: boolean
  /** Response time in milliseconds */
  responseTimeMs?: number
  /** Circuit breaker statistics */
  circuitBreaker: CircuitBreakerStats
  /** Last error if unhealthy */
  lastError?: AnthropicErrorDetails
  /** Timestamp of health check */
  timestamp: Date
}

/**
 * Service usage statistics
 */
export interface ServiceStats {
  /** Total number of requests made */
  totalRequests: number
  /** Number of successful requests */
  successfulRequests: number
  /** Number of failed requests */
  failedRequests: number
  /** Average response time in milliseconds */
  averageResponseTimeMs: number
  /** Total tokens consumed */
  totalTokensUsed: number
  /** Error breakdown by type */
  errorsByType: Record<AnthropicErrorType, number>
  /** Last reset timestamp */
  lastResetTime: Date
}

/**
 * Anthropic API message structure
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string }>
}

/**
 * Request payload for Anthropic Messages API
 */
export interface AnthropicMessageRequest {
  model: Model
  max_tokens: number
  messages: MessageParam[]
  system?: string
  temperature?: number
  top_p?: number
  top_k?: number
  metadata?: Record<string, unknown>
}

/**
 * Response from Anthropic Messages API
 */
export interface AnthropicMessageResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{ type: 'text'; text: string }>
  model: string
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence'
  stop_sequence?: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  /** Requests remaining in current window */
  remaining: number
  /** Total requests allowed per window */
  limit: number
  /** Time when rate limit resets (Unix timestamp) */
  resetTime: number
  /** Duration of rate limit window in seconds */
  windowDurationSeconds: number
}

/**
 * Type guard to check if error is an Anthropic API error
 */
export function isAnthropicApiError(error: unknown): error is { status?: number; message?: string; type?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'message' in error || 'type' in error)
  )
}

/**
 * Type guard to check if error details are retryable
 */
export function isRetryableError(errorDetails: AnthropicErrorDetails): boolean {
  const retryableTypes = [
    AnthropicErrorType.NETWORK,
    AnthropicErrorType.TIMEOUT,
    AnthropicErrorType.RATE_LIMIT,
    AnthropicErrorType.API_ERROR
  ]

  return errorDetails.retryable && retryableTypes.includes(errorDetails.type)
}
