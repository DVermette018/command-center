import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import type {
  AnthropicServiceConfig,
  PromptEnhancementParams,
  PromptEnhancementResponse,
  PromptContext,
  PromptEnhancementOptions,
  HealthCheckResult,
  ServiceStats,
  RetryConfig,
  AnthropicErrorType,
  AnthropicMessageRequest,
  AnthropicMessageResponse
} from '../../types/anthropic'
import {
  AnthropicErrorFactory,
  AnthropicConfigurationError,
  AnthropicValidationError,
  AnthropicTimeoutError,
  AnthropicApiError,
  type AnthropicServiceError
} from './anthropic-errors'
import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker'

// Legacy interface for backward compatibility
interface AnthropicConfig {
  apiKey: string
  maxTokens?: number
  model?: string
  timeout?: number
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<AnthropicServiceConfig> = {
  apiKey: '',
  maxTokens: 4000,
  model: 'claude-3-5-sonnet-20241022',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeoutMs: 60000 // 1 minute
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  monitoringWindowMs: 300000, // 5 minutes
  minimumThroughput: 10
}

/**
 * Configured Anthropic client instance
 */
let anthropicClient: Anthropic | null = null

/**
 * Initialize the Anthropic client with configuration
 */
export function initializeAnthropicClient(config?: Partial<AnthropicConfig>): Anthropic {
  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey,
      timeout: config?.timeout || DEFAULT_CONFIG.timeout,
      dangerouslyAllowBrowser: process.env.NODE_ENV === 'test'
    })
  }

  return anthropicClient
}

/**
 * Get the configured Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    return initializeAnthropicClient()
  }
  return anthropicClient
}

/**
 * Enhanced Anthropic service with comprehensive error handling, retry logic, and circuit breaker
 */
export class AnthropicService {
  private client: Anthropic
  private config: Required<AnthropicServiceConfig>
  private retryConfig: RetryConfig
  private circuitBreaker: CircuitBreaker
  private stats: ServiceStats
  private logger: Console = console

  constructor(config?: Partial<AnthropicServiceConfig>, testClient?: Anthropic) {
    // Merge configuration with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY || '',
      ...config,
    }

    // Validate configuration
    this.validateConfig()

    // Initialize retry configuration
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxAttempts: this.config.maxRetries,
      baseDelayMs: this.config.retryDelayMs,
      maxDelayMs: this.config.maxRetryDelayMs
    }

    // Initialize circuit breaker
    const circuitBreakerConfig: CircuitBreakerConfig = {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      failureThreshold: this.config.circuitBreakerThreshold,
      resetTimeoutMs: this.config.circuitBreakerResetTimeoutMs
    }
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig)

    // Initialize statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTimeMs: 0,
      totalTokensUsed: 0,
      errorsByType: {} as Record<AnthropicErrorType, number>,
      lastResetTime: new Date()
    }

    // Initialize Anthropic client - use test client if provided
    this.client = testClient || initializeAnthropicClient(this.config)
  }

  /**
   * Enhanced prompt generation using Claude with comprehensive error handling and retry logic
   * 
   * @param params - Prompt enhancement parameters including original prompt and context
   * @returns Enhanced prompt with metadata
   */
  async enhancePrompt(params: PromptEnhancementParams): Promise<PromptEnhancementResponse>
  async enhancePrompt(originalPrompt: string, context?: Record<string, unknown>): Promise<string>
  async enhancePrompt(
    paramsOrPrompt: PromptEnhancementParams | string,
    legacyContext?: Record<string, unknown>
  ): Promise<PromptEnhancementResponse | string> {
    const startTime = Date.now()
    this.stats.totalRequests++

    try {
      // Handle legacy method signature
      const params: PromptEnhancementParams = typeof paramsOrPrompt === 'string'
        ? { originalPrompt: paramsOrPrompt, context: legacyContext }
        : paramsOrPrompt

      // Validate input parameters
      this.validatePromptParams(params)

      // Execute with circuit breaker protection
      const result = await this.circuitBreaker.execute(async () => {
        return await this.executeWithRetry(async () => {
          return await this.performPromptEnhancement(params)
        })
      })

      // Update statistics
      const responseTime = Date.now() - startTime
      this.updateSuccessStats(responseTime, result.metadata.tokenUsage.total)

      // Return appropriate format based on call signature
      return typeof paramsOrPrompt === 'string' ? result.enhancedPrompt : result

    } catch (error) {
      // Update error statistics
      const anthropicError = AnthropicErrorFactory.fromUnknown(error)
      this.updateErrorStats(anthropicError)

      // Log error with context
      this.logger.error('Prompt enhancement failed', {
        ...anthropicError.toLogContext(),
        originalPromptLength: typeof paramsOrPrompt === 'string' 
          ? paramsOrPrompt.length 
          : paramsOrPrompt.originalPrompt.length,
        processingTimeMs: Date.now() - startTime
      })

      // Re-throw as appropriate error type
      throw anthropicError
    }
  }

  /**
   * Comprehensive health check for the Anthropic service
   * 
   * @returns Detailed health status including circuit breaker state and response time
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    let lastError: AnthropicServiceError | undefined

    try {
      // Check configuration
      if (!this.config.apiKey) {
        throw new AnthropicConfigurationError('API key is not configured')
      }

      // Perform lightweight API test if circuit breaker allows
      if (this.circuitBreaker.isHealthy()) {
        try {
          const testResponse = await this.client.messages.create({
            model: this.config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })

          // Validate basic response structure
          if (!testResponse || !testResponse.content || !Array.isArray(testResponse.content)) {
            throw new AnthropicApiError('Invalid health check response format', 500)
          }
        } catch (error) {
          lastError = AnthropicErrorFactory.fromUnknown(error)
          throw lastError
        }
      }

      const responseTime = Date.now() - startTime
      return {
        healthy: true,
        responseTimeMs: responseTime,
        circuitBreaker: this.circuitBreaker.getStats(),
        timestamp: new Date()
      }

    } catch (error) {
      const anthropicError = lastError || AnthropicErrorFactory.fromUnknown(error)
      
      return {
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        circuitBreaker: this.circuitBreaker.getStats(),
        lastError: anthropicError.toDetails(),
        timestamp: new Date()
      }
    }
  }

  /**
   * Get current service configuration (with API key redacted for security)
   */
  getConfig(): Omit<Required<AnthropicServiceConfig>, 'apiKey'> & { apiKey: string } {
    const { apiKey, ...safeConfig } = this.config
    return {
      ...safeConfig,
      apiKey: apiKey ? '***REDACTED***' : 'NOT_SET',
    }
  }

  /**
   * Get service usage statistics
   */
  getStats(): ServiceStats {
    return { ...this.stats }
  }

  /**
   * Reset service statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTimeMs: 0,
      totalTokensUsed: 0,
      errorsByType: {} as Record<AnthropicErrorType, number>,
      lastResetTime: new Date()
    }
  }

  /**
   * Validate service configuration
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new AnthropicConfigurationError(
        'ANTHROPIC_API_KEY environment variable is required'
      )
    }

    if (this.config.maxTokens <= 0) {
      throw new AnthropicConfigurationError(
        'maxTokens must be a positive number'
      )
    }

    if (this.config.timeout <= 0) {
      throw new AnthropicConfigurationError(
        'timeout must be a positive number'
      )
    }
  }

  /**
   * Validate prompt enhancement parameters
   */
  private validatePromptParams(params: PromptEnhancementParams): void {
    if (!params.originalPrompt || params.originalPrompt.trim().length === 0) {
      throw new AnthropicValidationError(
        'Original prompt cannot be empty',
        ['originalPrompt: must be a non-empty string']
      )
    }

    if (params.originalPrompt.length > 100000) {
      throw new AnthropicValidationError(
        'Original prompt is too long',
        ['originalPrompt: must be less than 100,000 characters']
      )
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: AnthropicServiceError | undefined
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = AnthropicErrorFactory.fromUnknown(error)
        
        // Don't retry if error is not retryable or this is the last attempt
        if (!lastError.retryable || attempt === this.retryConfig.maxAttempts) {
          throw lastError
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelayMs
        )
        
        const jitter = baseDelay * this.retryConfig.jitterFactor * Math.random()
        const delayMs = Math.max(0, baseDelay + jitter)

        this.logger.warn(`Retry attempt ${attempt}/${this.retryConfig.maxAttempts} after ${delayMs}ms`, {
          error: lastError.message,
          errorType: lastError.type,
          retryable: lastError.retryable,
          attempt,
          delayMs
        })

        await this.sleep(delayMs)
      }
    }

    // This should never be reached due to the logic above, but TypeScript requires it
    throw lastError || AnthropicErrorFactory.fromUnknown(new Error('Unknown retry error'))
  }

  /**
   * Perform the actual prompt enhancement API call
   */
  private async performPromptEnhancement(params: PromptEnhancementParams): Promise<PromptEnhancementResponse> {
    const startTime = Date.now()
    
    // Build system prompt for enhancement
    const systemPrompt = this.buildEnhancementSystemPrompt(params.options)
    
    // Build user message with context
    const userMessage = this.buildEnhancementUserMessage(params)

    // Prepare API request
    const request: AnthropicMessageRequest = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
      temperature: 0.3 // Lower temperature for more consistent enhancement
    }

    // Make API call with timeout
    const response = await this.makeApiCallWithTimeout(request)

    // Validate response structure
    if (!response) {
      throw new AnthropicApiError(
        'No response received from Anthropic API',
        500,
        new Error('Response is null or undefined')
      )
    }

    if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
      throw new AnthropicApiError(
        'Invalid response format from Anthropic API',
        500,
        new Error('Response missing valid content array')
      )
    }

    // Extract enhanced prompt from response
    const enhancedPrompt = response.content[0]?.text || params.originalPrompt
    const processingTime = Date.now() - startTime

    return {
      enhancedPrompt,
      confidence: this.calculateConfidence(response),
      metadata: {
        originalLength: params.originalPrompt.length,
        enhancedLength: enhancedPrompt.length,
        processingTimeMs: processingTime,
        modelUsed: response.model,
        tokenUsage: {
          input: response.usage?.input_tokens || 0,
          output: response.usage?.output_tokens || 0,
          total: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        }
      },
      suggestions: this.extractSuggestions(response)
    }
  }

  /**
   * Build system prompt for enhancement based on options
   */
  private buildEnhancementSystemPrompt(options?: PromptEnhancementOptions): string {
    const style = options?.style || 'professional'
    const focus = options?.focus || ['clarity', 'detail']
    
    let systemPrompt = `You are an expert prompt engineer. Your task is to enhance user prompts to be more effective, clear, and comprehensive.

Enhancement style: ${style}
Focus areas: ${focus.join(', ')}

Guidelines:
- Maintain the original intent and core requirements
- Improve clarity and specificity
- Add relevant context and examples where helpful
- Structure the prompt logically
- Ensure actionability and measurability where appropriate`

    if (options?.customInstructions) {
      systemPrompt += `\n\nCustom instructions: ${options.customInstructions}`
    }

    if (options?.maxLength) {
      systemPrompt += `\n\nKeep the enhanced prompt under ${options.maxLength} characters.`
    }

    return systemPrompt
  }

  /**
   * Build user message with context and original prompt
   */
  private buildEnhancementUserMessage(params: PromptEnhancementParams): string {
    let message = `Please enhance the following prompt:\n\n${params.originalPrompt}`

    if (params.context) {
      message += '\n\nAdditional context:'
      
      for (const [key, value] of Object.entries(params.context)) {
        if (value && typeof value === 'string') {
          message += `\n- ${key}: ${value}`
        }
      }
    }

    return message
  }

  /**
   * Make API call with timeout protection
   */
  private async makeApiCallWithTimeout(request: AnthropicMessageRequest): Promise<AnthropicMessageResponse> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AnthropicTimeoutError(
          `API request timed out after ${this.config.timeout}ms`,
          this.config.timeout
        ))
      }, this.config.timeout)
    })

    const apiPromise = this.client.messages.create(request)

    return Promise.race([apiPromise, timeoutPromise]) as Promise<AnthropicMessageResponse>
  }

  /**
   * Calculate confidence score based on response quality
   */
  private calculateConfidence(response: AnthropicMessageResponse): number {
    // Simple confidence calculation based on response completeness
    if (response.stop_reason === 'max_tokens') {
      return 0.7 // Response was truncated
    }
    
    if (response.stop_reason === 'end_turn') {
      return 0.9 // Natural completion
    }
    
    return 0.8 // Default confidence
  }

  /**
   * Extract suggestions from API response
   */
  private extractSuggestions(response: AnthropicMessageResponse): string[] {
    // For now, return empty array - could be enhanced to parse suggestions from response
    return []
  }

  /**
   * Update statistics for successful requests
   */
  private updateSuccessStats(responseTime: number, tokensUsed: number): void {
    this.stats.successfulRequests++
    this.stats.totalTokensUsed += tokensUsed
    
    // Update average response time
    const totalResponseTime = this.stats.averageResponseTimeMs * (this.stats.successfulRequests - 1) + responseTime
    this.stats.averageResponseTimeMs = totalResponseTime / this.stats.successfulRequests
  }

  /**
   * Update statistics for failed requests
   */
  private updateErrorStats(error: AnthropicServiceError): void {
    this.stats.failedRequests++
    this.stats.errorsByType[error.type] = (this.stats.errorsByType[error.type] || 0) + 1
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Default service instance (lazy initialization)
 */
export const anthropicService = (() => {
  let instance: AnthropicService | null = null
  
  return {
    get service(): AnthropicService {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance
    },
    
    // For compatibility with direct method calls
    enhancePrompt: (...args: any[]) => {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance.enhancePrompt(...args)
    },
    
    healthCheck: () => {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance.healthCheck()
    },
    
    getConfig: () => {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance.getConfig()
    },
    
    getStats: () => {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance.getStats()
    },
    
    resetStats: () => {
      if (!instance) {
        instance = new AnthropicService()
      }
      return instance.resetStats()
    }
  }
})()

/**
 * Export the client for direct access if needed
 */
export { Anthropic } from '@anthropic-ai/sdk'