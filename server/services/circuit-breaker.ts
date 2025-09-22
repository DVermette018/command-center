/**
 * Circuit breaker implementation for Anthropic service
 * Prevents cascading failures by temporarily stopping calls to failing services
 */

import { CircuitBreakerState, type CircuitBreakerStats } from '../../types/anthropic'
import { AnthropicCircuitBreakerError } from './anthropic-errors'

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number
  /** Time to wait before attempting to close circuit (ms) */
  resetTimeoutMs: number
  /** Time window for failure counting (ms) */
  monitoringWindowMs: number
  /** Minimum number of calls before circuit can open */
  minimumThroughput: number
}

/**
 * Circuit breaker implementation with state management and failure tracking
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount = 0
  private successCount = 0
  private totalCalls = 0
  private lastFailureTime?: Date
  private nextAttemptTime?: Date
  private readonly failures: Date[] = []

  constructor(private readonly config: CircuitBreakerConfig) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit breaker allows the call
    if (!this.canExecute()) {
      throw new AnthropicCircuitBreakerError(
        'Circuit breaker is open - service is temporarily unavailable',
        this.nextAttemptTime || new Date(Date.now() + this.config.resetTimeoutMs)
      )
    }

    this.totalCalls++

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Check if circuit breaker allows execution
   */
  private canExecute(): boolean {
    const now = Date.now()

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true

      case CircuitBreakerState.OPEN:
        if (this.nextAttemptTime && now >= this.nextAttemptTime.getTime()) {
          this.state = CircuitBreakerState.HALF_OPEN
          return true
        }
        return false

      case CircuitBreakerState.HALF_OPEN:
        return true

      default:
        return false
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Reset circuit breaker after successful call in half-open state
      this.reset()
    }
    
    // Clean old failures outside monitoring window
    this.cleanOldFailures()
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = new Date()
    this.failures.push(now)
    this.lastFailureTime = now

    // Clean old failures outside monitoring window
    this.cleanOldFailures()

    // Count recent failures
    const recentFailures = this.failures.length
    this.failureCount = recentFailures

    // Check if we should open the circuit
    if (
      this.state !== CircuitBreakerState.OPEN &&
      recentFailures >= this.config.failureThreshold &&
      this.totalCalls >= this.config.minimumThroughput
    ) {
      this.openCircuit()
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs)
  }

  /**
   * Reset circuit breaker to closed state
   */
  private reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.failures.length = 0
    this.nextAttemptTime = undefined
  }

  /**
   * Remove failures outside the monitoring window
   */
  private cleanOldFailures(): void {
    const cutoffTime = Date.now() - this.config.monitoringWindowMs
    
    // Remove old failures
    let index = 0
    while (index < this.failures.length && this.failures[index].getTime() < cutoffTime) {
      index++
    }
    
    if (index > 0) {
      this.failures.splice(0, index)
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanOldFailures()
    
    return {
      state: this.state,
      failureCount: this.failures.length,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    }
  }

  /**
   * Force circuit breaker to open state (for testing/maintenance)
   */
  forceOpen(): void {
    this.state = CircuitBreakerState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs)
  }

  /**
   * Force circuit breaker to closed state (for testing/maintenance)
   */
  forceClose(): void {
    this.reset()
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED
  }

  /**
   * Get failure rate in the current monitoring window
   */
  getFailureRate(): number {
    this.cleanOldFailures()
    
    if (this.totalCalls === 0) {
      return 0
    }
    
    return this.failures.length / Math.min(this.totalCalls, this.config.minimumThroughput)
  }
}