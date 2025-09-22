/**
 * Integration tests for Anthropic service
 * Tests end-to-end functionality with the ability to use real API calls when needed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnthropicService } from '~~/server/services/anthropic'
import { AnthropicConfigurationError } from '~~/server/services/anthropic-errors'
import type { PromptEnhancementParams } from '~~/types/anthropic'

// Set test timeout higher for integration tests
vi.setConfig({ testTimeout: 30000 })

describe('Anthropic Service Integration Tests', () => {
  let service: AnthropicService
  const useRealAPI = process.env.INTEGRATION_TEST_REAL_API === 'true'
  const testApiKey = process.env.ANTHROPIC_API_KEY || 'test-key'

  beforeEach(() => {
    if (!useRealAPI) {
      // Mock for regular testing
      process.env.ANTHROPIC_API_KEY = 'mock-api-key-for-testing'
    }
  })

  afterEach(() => {
    if (!useRealAPI) {
      delete process.env.ANTHROPIC_API_KEY
    }
  })

  describe('Service Initialization', () => {
    it('should initialize service with environment API key', () => {
      if (useRealAPI && !testApiKey.startsWith('sk-')) {
        console.warn('Skipping real API test - no valid API key found')
        return
      }

      service = new AnthropicService()
      const config = service.getConfig()

      expect(config.apiKey).toBe('***REDACTED***')
      expect(config.model).toBeDefined()
      expect(config.maxTokens).toBeGreaterThan(0)
    })

    it('should fail initialization with missing API key', () => {
      delete process.env.ANTHROPIC_API_KEY

      expect(() => new AnthropicService()).toThrow(AnthropicConfigurationError)
    })

    it('should initialize with custom configuration', () => {
      const customConfig = {
        apiKey: useRealAPI ? testApiKey : 'custom-test-key',
        maxTokens: 2000,
        timeout: 15000,
        maxRetries: 5
      }

      service = new AnthropicService(customConfig)
      const config = service.getConfig()

      expect(config.maxTokens).toBe(2000)
      expect(config.timeout).toBe(15000)
      expect(config.maxRetries).toBe(5)
    })
  })

  describe('Health Check Integration', () => {
    beforeEach(() => {
      service = new AnthropicService({
        apiKey: useRealAPI ? testApiKey : 'test-key'
      })
    })

    it('should perform health check', async () => {
      if (useRealAPI && !testApiKey.startsWith('sk-')) {
        console.warn('Skipping real API health check - no valid API key')
        return
      }

      const health = await service.healthCheck()

      expect(health).toBeDefined()
      expect(health.timestamp).toBeInstanceOf(Date)
      expect(health.circuitBreaker).toBeDefined()
      expect(typeof health.healthy).toBe('boolean')

      if (health.responseTimeMs !== undefined) {
        expect(health.responseTimeMs).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle health check with invalid API key', async () => {
      const invalidService = new AnthropicService({
        apiKey: 'invalid-key'
      })

      const health = await invalidService.healthCheck()

      expect(health.healthy).toBe(false)
      expect(health.lastError).toBeDefined()
      expect(health.lastError?.type).toBe('AUTHENTICATION')
    })
  })

  describe.skipIf(!useRealAPI)('Real API Integration', () => {
    beforeEach(() => {
      if (!testApiKey.startsWith('sk-')) {
        throw new Error('Valid Anthropic API key required for real API integration tests')
      }
      service = new AnthropicService({ apiKey: testApiKey })
    })

    it('should enhance a simple prompt using real API', async () => {
      const params: PromptEnhancementParams = {
        originalPrompt: 'Write a hello world function',
        options: {
          style: 'technical',
          focus: ['clarity']
        }
      }

      const result = await service.enhancePrompt(params)

      expect(result.enhancedPrompt).toBeDefined()
      expect(result.enhancedPrompt.length).toBeGreaterThan(params.originalPrompt.length)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.metadata.tokenUsage.total).toBeGreaterThan(0)
    })

    it('should handle context-aware enhancement', async () => {
      const params: PromptEnhancementParams = {
        originalPrompt: 'Create a user interface',
        context: {
          industry: 'fintech',
          projectType: 'mobile-app',
          audience: 'financial advisors'
        },
        options: {
          style: 'professional',
          focus: ['detail', 'structure'],
          includeExamples: true
        }
      }

      const result = await service.enhancePrompt(params)

      expect(result.enhancedPrompt).toContain('interface')
      expect(result.metadata.originalLength).toBe(params.originalPrompt.length)
      expect(result.metadata.modelUsed).toBeDefined()
    })

    it('should track real API statistics', async () => {
      const initialStats = service.getStats()
      const initialRequests = initialStats.totalRequests

      await service.enhancePrompt('Simple test prompt')

      const finalStats = service.getStats()
      expect(finalStats.totalRequests).toBe(initialRequests + 1)
      expect(finalStats.successfulRequests).toBe(initialStats.successfulRequests + 1)
      expect(finalStats.totalTokensUsed).toBeGreaterThan(initialStats.totalTokensUsed)
    })
  })

  describe('Mocked Integration Scenarios', () => {
    let mockClient: any

    beforeEach(() => {
      // Create mock client for controlled testing
      mockClient = {
        messages: {
          create: vi.fn()
        }
      }
      service = new AnthropicService({ apiKey: 'test-key' }, mockClient)
    })

    it('should handle end-to-end prompt enhancement flow', async () => {
      const mockResponse = {
        id: 'msg_integration_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{
          type: 'text' as const,
          text: 'Here is an enhanced version of your prompt:\n\nCreate a comprehensive user interface for a financial management application that allows users to track their expenses, manage budgets, and generate financial reports.'
        }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 150, output_tokens: 350 }
      }

      mockClient.messages.create.mockResolvedValueOnce(mockResponse)

      const params: PromptEnhancementParams = {
        originalPrompt: 'Create a user interface for expense tracking',
        context: {
          industry: 'fintech',
          projectType: 'web-app',
          timeline: '3 months',
          audience: 'small business owners'
        },
        options: {
          style: 'professional',
          focus: ['clarity', 'detail', 'structure'],
          maxLength: 1000,
          includeExamples: false,
          customInstructions: 'Focus on user experience and accessibility'
        }
      }

      const result = await service.enhancePrompt(params)

      // Validate enhanced prompt
      expect(result.enhancedPrompt).toContain('enhanced version')
      expect(result.enhancedPrompt).toContain('financial')
      expect(result.enhancedPrompt.length).toBeGreaterThan(params.originalPrompt.length)

      // Validate metadata
      expect(result.metadata.originalLength).toBe(params.originalPrompt.length)
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.tokenUsage.input).toBe(150)
      expect(result.metadata.tokenUsage.output).toBe(350)
      expect(result.metadata.tokenUsage.total).toBe(500)

      // Validate confidence score
      expect(result.confidence).toBe(0.9) // Should be high for end_turn

      // Validate API call parameters
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: expect.stringContaining(params.originalPrompt)
        }],
        system: expect.stringContaining('professional'),
        temperature: 0.3
      })
    })

    it('should handle circuit breaker integration', async () => {
      const cbService = new AnthropicService({
        apiKey: 'test-key',
        circuitBreakerThreshold: 2,
        maxRetries: 1
      }, mockClient)

      // Mock consistent failures
      const apiError = new Error('API Error')
      mockClient.messages.create.mockRejectedValue(apiError)

      // Make requests to trigger circuit breaker
      await expect(cbService.enhancePrompt('Test 1')).rejects.toThrow()
      await expect(cbService.enhancePrompt('Test 2')).rejects.toThrow()

      // Check circuit breaker stats
      const health = await cbService.healthCheck()
      expect(health.circuitBreaker.failureCount).toBeGreaterThan(0)
    })

    it('should handle retry logic with eventual success', async () => {
      const retryService = new AnthropicService({
        apiKey: 'test-key',
        maxRetries: 3,
        retryDelayMs: 10 // Fast retry for testing
      }, mockClient)

      const successResponse = {
        id: 'msg_success',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{ type: 'text' as const, text: 'Success after retries' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 10, output_tokens: 25 }
      }

      // Fail twice, then succeed
      mockClient.messages.create
        .mockRejectedValueOnce(new Error('TIMEOUT'))
        .mockRejectedValueOnce(new Error('NETWORK_ERROR'))
        .mockResolvedValueOnce(successResponse)

      const result = await retryService.enhancePrompt('Retry test')

      expect(result.enhancedPrompt).toBe('Success after retries')
      expect(mockClient.messages.create).toHaveBeenCalledTimes(3)

      // Verify statistics include the successful request
      const stats = retryService.getStats()
      expect(stats.successfulRequests).toBe(1)
      expect(stats.failedRequests).toBe(0) // Only final result counts
    })

    it('should handle complex error recovery scenarios', async () => {
      // Test mixed error types and recovery
      mockClient.messages.create
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' }) // Retryable
        .mockRejectedValueOnce(new Error('TIMEOUT')) // Retryable
        .mockResolvedValueOnce({
          id: 'msg_recovered',
          type: 'message' as const,
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Recovered successfully' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn' as const,
          usage: { input_tokens: 20, output_tokens: 30 }
        })

      const result = await service.enhancePrompt('Error recovery test')
      expect(result.enhancedPrompt).toBe('Recovered successfully')
    })
  })

  describe('Performance and Load Testing', () => {
    let mockClient: any

    beforeEach(() => {
      mockClient = {
        messages: {
          create: vi.fn()
        }
      }
      service = new AnthropicService({ apiKey: 'test-key' }, mockClient)
    })

    it('should handle concurrent requests', async () => {
      const mockResponse = {
        id: 'msg_concurrent',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{ type: 'text' as const, text: 'Concurrent response' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 10, output_tokens: 20 }
      }

      mockClient.messages.create.mockResolvedValue(mockResponse)

      // Create 5 concurrent requests
      const promises = Array(5).fill(null).map((_, index) =>
        service.enhancePrompt(`Concurrent test ${index}`)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.enhancedPrompt).toBe('Concurrent response')
      })

      const stats = service.getStats()
      expect(stats.totalRequests).toBe(5)
      expect(stats.successfulRequests).toBe(5)
    }, 10000)

    it('should maintain performance under load', async () => {
      const mockResponse = {
        id: 'msg_load',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{ type: 'text' as const, text: 'Load test response' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 15, output_tokens: 25 }
      }

      // Add small delay to simulate API response time
      mockClient.messages.create.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 10))
      )

      const startTime = Date.now()

      // Process 10 requests
      for (let i = 0; i < 10; i++) {
        await service.enhancePrompt(`Load test ${i}`)
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds

      const stats = service.getStats()
      expect(stats.totalRequests).toBe(10)
      expect(stats.averageResponseTimeMs).toBeGreaterThan(0)
      expect(stats.averageResponseTimeMs).toBeLessThan(1000) // Average should be reasonable
    }, 10000)
  })
})
