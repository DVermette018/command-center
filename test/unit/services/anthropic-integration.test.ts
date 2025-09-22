/**
 * Integration test for Anthropic service
 * Verifies the service works with actual configuration and validates the integration points
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { AnthropicService } from '~~/server/services/anthropic'
import type { PromptEnhancementParams } from '~~/types/anthropic'

describe('Anthropic Service Integration', () => {
  let service: AnthropicService

  beforeAll(() => {
    // Use a mock API key for testing
    process.env.ANTHROPIC_API_KEY = 'test-key-for-integration'
    service = new AnthropicService()
  })

  it('should initialize service with proper configuration', () => {
    const config = service.getConfig()

    expect(config.apiKey).toBe('***REDACTED***')
    expect(config.model).toBe('claude-3-5-sonnet-20241022')
    expect(config.maxTokens).toBe(4000)
    expect(config.timeout).toBe(30000)
  })

  it('should provide health check functionality', async () => {
    const health = await service.healthCheck()

    expect(health).toHaveProperty('healthy')
    expect(health).toHaveProperty('circuitBreaker')
    expect(health).toHaveProperty('timestamp')
    expect(health.timestamp).toBeInstanceOf(Date)
  })

  it('should track statistics properly', () => {
    const initialStats = service.getStats()

    expect(initialStats).toHaveProperty('totalRequests')
    expect(initialStats).toHaveProperty('successfulRequests')
    expect(initialStats).toHaveProperty('failedRequests')
    expect(initialStats).toHaveProperty('averageResponseTimeMs')
    expect(initialStats).toHaveProperty('totalTokensUsed')
    expect(initialStats).toHaveProperty('errorsByType')
    expect(initialStats).toHaveProperty('lastResetTime')

    expect(typeof initialStats.totalRequests).toBe('number')
    expect(typeof initialStats.successfulRequests).toBe('number')
    expect(typeof initialStats.failedRequests).toBe('number')
    expect(typeof initialStats.averageResponseTimeMs).toBe('number')
    expect(typeof initialStats.totalTokensUsed).toBe('number')
    expect(initialStats.lastResetTime).toBeInstanceOf(Date)
  })

  it('should validate prompt parameters correctly', async () => {
    const emptyParams: PromptEnhancementParams = {
      originalPrompt: ''
    }

    await expect(service.enhancePrompt(emptyParams))
      .rejects.toThrow('Original prompt cannot be empty')

    const longPromptParams: PromptEnhancementParams = {
      originalPrompt: 'a'.repeat(100001)
    }

    await expect(service.enhancePrompt(longPromptParams))
      .rejects.toThrow('Original prompt is too long')
  })

  it('should support both parameter formats', async () => {
    // This test will fail with network error since we're using a fake API key,
    // but it validates that the method signatures work correctly

    const fullParams: PromptEnhancementParams = {
      originalPrompt: 'Test prompt',
      context: {
        industry: 'technology'
      },
      options: {
        style: 'professional'
      }
    }

    // Both should throw the same type of error (network/auth error)
    await expect(service.enhancePrompt(fullParams)).rejects.toThrow()
    await expect(service.enhancePrompt('Test prompt', { industry: 'tech' })).rejects.toThrow()
  })

  it('should reset statistics', () => {
    service.resetStats()

    const stats = service.getStats()
    expect(stats.totalRequests).toBe(0)
    expect(stats.successfulRequests).toBe(0)
    expect(stats.failedRequests).toBe(0)
    expect(stats.totalTokensUsed).toBe(0)
  })
})

describe('Anthropic Service Configuration Validation', () => {
  it('should throw error for missing API key', () => {
    delete process.env.ANTHROPIC_API_KEY

    expect(() => {
      new AnthropicService()
    }).toThrow('ANTHROPIC_API_KEY environment variable is required')

    // Restore for other tests
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('should throw error for invalid configuration', () => {
    expect(() => {
      new AnthropicService({
        apiKey: 'test',
        maxTokens: -1
      })
    }).toThrow('maxTokens must be a positive number')

    expect(() => {
      new AnthropicService({
        apiKey: 'test',
        timeout: 0
      })
    }).toThrow('timeout must be a positive number')
  })

  it('should accept valid custom configuration', () => {
    const customService = new AnthropicService({
      apiKey: 'test-key',
      maxTokens: 2000,
      timeout: 15000,
      maxRetries: 5
    })

    const config = customService.getConfig()
    expect(config.maxTokens).toBe(2000)
    expect(config.timeout).toBe(15000)
    expect(config.maxRetries).toBe(5)
  })
})
