import { performance } from 'perf_hooks'
import { PrismaClient } from '@prisma/client'

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  responseTime: number
  memoryBefore: number
  memoryAfter: number
  memoryDelta: number
  timestamp: number
  operation: string
  details?: Record<string, any>
}

/**
 * Load test results interface
 */
export interface LoadTestResult {
  operationName: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  requestsPerSecond: number
  totalDuration: number
  memoryUsage: {
    initial: number
    peak: number
    final: number
    average: number
  }
  errors: string[]
}

/**
 * Database performance metrics interface
 */
export interface DatabaseMetrics {
  queryTime: number
  queryCount: number
  operation: string
  recordCount?: number
}

/**
 * Performance monitor utility class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private dbMetrics: DatabaseMetrics[] = []
  private memorySnapshots: number[] = []

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage()
    return Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100
  }

  /**
   * Start measuring performance for an operation
   */
  startMeasurement(operation: string): () => PerformanceMetrics {
    const startTime = performance.now()
    const memoryBefore = this.getCurrentMemoryUsage()
    
    return () => {
      const endTime = performance.now()
      const memoryAfter = this.getCurrentMemoryUsage()
      
      const metric: PerformanceMetrics = {
        operation,
        responseTime: endTime - startTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter - memoryBefore,
        timestamp: Date.now()
      }
      
      this.metrics.push(metric)
      this.memorySnapshots.push(memoryAfter)
      
      return metric
    }
  }

  /**
   * Measure database query performance
   */
  measureDatabaseQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    recordCount?: number
  ): Promise<{ result: T; metrics: DatabaseMetrics }> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now()
      
      try {
        const result = await queryFn()
        const endTime = performance.now()
        
        const metrics: DatabaseMetrics = {
          operation,
          queryTime: endTime - startTime,
          queryCount: 1,
          recordCount
        }
        
        this.dbMetrics.push(metrics)
        resolve({ result, metrics })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Run concurrent load test
   */
  async runLoadTest<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      concurrentUsers: number
      requestsPerUser: number
      timeout?: number
    }
  ): Promise<LoadTestResult> {
    const { concurrentUsers, requestsPerUser, timeout = 30000 } = options
    const totalRequests = concurrentUsers * requestsPerUser
    
    const results: Array<{ success: boolean; responseTime: number; error?: string }> = []
    const startTime = performance.now()
    const initialMemory = this.getCurrentMemoryUsage()
    const memoryReadings: number[] = [initialMemory]
    
    // Memory monitoring interval
    const memoryInterval = setInterval(() => {
      memoryReadings.push(this.getCurrentMemoryUsage())
    }, 100)

    try {
      // Create concurrent user promises
      const userPromises = Array.from({ length: concurrentUsers }, async () => {
        const userResults: Array<{ success: boolean; responseTime: number; error?: string }> = []
        
        for (let i = 0; i < requestsPerUser; i++) {
          const requestStartTime = performance.now()
          
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
            
            await Promise.race([operation(), timeoutPromise])
            
            const requestEndTime = performance.now()
            userResults.push({
              success: true,
              responseTime: requestEndTime - requestStartTime
            })
          } catch (error) {
            const requestEndTime = performance.now()
            userResults.push({
              success: false,
              responseTime: requestEndTime - requestStartTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        
        return userResults
      })

      // Wait for all users to complete
      const allUserResults = await Promise.all(userPromises)
      
      // Flatten results
      allUserResults.forEach(userResults => {
        results.push(...userResults)
      })
      
    } finally {
      clearInterval(memoryInterval)
    }

    const endTime = performance.now()
    const totalDuration = endTime - startTime
    const finalMemory = this.getCurrentMemoryUsage()
    
    // Calculate statistics
    const successfulRequests = results.filter(r => r.success).length
    const failedRequests = results.filter(r => !r.success).length
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b)
    const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error')
    
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0
    const p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
    const minResponseTime = responseTimes[0] || 0
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0
    
    const requestsPerSecond = (successfulRequests / totalDuration) * 1000
    
    const peakMemory = Math.max(...memoryReadings)
    const averageMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length

    return {
      operationName,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      p50ResponseTime: Math.round(p50ResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      minResponseTime: Math.round(minResponseTime * 100) / 100,
      maxResponseTime: Math.round(maxResponseTime * 100) / 100,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      totalDuration: Math.round(totalDuration * 100) / 100,
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        average: Math.round(averageMemory * 100) / 100
      },
      errors: [...new Set(errors)] // Remove duplicates
    }
  }

  /**
   * Generate large test dataset
   */
  async generateLargeDataset<T>(
    factoryFn: () => Promise<T>,
    count: number,
    batchSize: number = 50
  ): Promise<T[]> {
    const results: T[] = []
    const batches = Math.ceil(count / batchSize)
    
    for (let i = 0; i < batches; i++) {
      const batchPromises: Promise<T>[] = []
      const currentBatchSize = Math.min(batchSize, count - i * batchSize)
      
      for (let j = 0; j < currentBatchSize; j++) {
        batchPromises.push(factoryFn())
      }
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches to prevent overwhelming the database
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    return results
  }

  /**
   * Assert performance thresholds
   */
  assertPerformance(
    metrics: PerformanceMetrics | LoadTestResult,
    thresholds: {
      maxResponseTime?: number
      maxMemoryUsage?: number
      minRequestsPerSecond?: number
      maxFailureRate?: number
    }
  ): void {
    if ('responseTime' in metrics) {
      // Single operation metrics
      if (thresholds.maxResponseTime && metrics.responseTime > thresholds.maxResponseTime) {
        throw new Error(`Response time ${metrics.responseTime}ms exceeds threshold ${thresholds.maxResponseTime}ms`)
      }
      
      if (thresholds.maxMemoryUsage && metrics.memoryAfter > thresholds.maxMemoryUsage) {
        throw new Error(`Memory usage ${metrics.memoryAfter}MB exceeds threshold ${thresholds.maxMemoryUsage}MB`)
      }
    } else {
      // Load test results
      if (thresholds.maxResponseTime && metrics.p95ResponseTime > thresholds.maxResponseTime) {
        throw new Error(`P95 response time ${metrics.p95ResponseTime}ms exceeds threshold ${thresholds.maxResponseTime}ms`)
      }
      
      if (thresholds.maxMemoryUsage && metrics.memoryUsage.peak > thresholds.maxMemoryUsage) {
        throw new Error(`Peak memory usage ${metrics.memoryUsage.peak}MB exceeds threshold ${thresholds.maxMemoryUsage}MB`)
      }
      
      if (thresholds.minRequestsPerSecond && metrics.requestsPerSecond < thresholds.minRequestsPerSecond) {
        throw new Error(`Requests per second ${metrics.requestsPerSecond} is below threshold ${thresholds.minRequestsPerSecond}`)
      }
      
      if (thresholds.maxFailureRate) {
        const failureRate = (metrics.failedRequests / metrics.totalRequests) * 100
        if (failureRate > thresholds.maxFailureRate) {
          throw new Error(`Failure rate ${failureRate.toFixed(2)}% exceeds threshold ${thresholds.maxFailureRate}%`)
        }
      }
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalOperations: number
      totalDatabaseQueries: number
      averageResponseTime: number
      averageMemoryUsage: number
      peakMemoryUsage: number
    }
    operations: PerformanceMetrics[]
    databaseQueries: DatabaseMetrics[]
  } {
    const totalOperations = this.metrics.length
    const totalDatabaseQueries = this.dbMetrics.length
    
    const averageResponseTime = totalOperations > 0 
      ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalOperations 
      : 0
    
    const averageMemoryUsage = this.memorySnapshots.length > 0
      ? this.memorySnapshots.reduce((sum, m) => sum + m, 0) / this.memorySnapshots.length
      : 0
    
    const peakMemoryUsage = this.memorySnapshots.length > 0
      ? Math.max(...this.memorySnapshots)
      : 0

    return {
      summary: {
        totalOperations,
        totalDatabaseQueries,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        averageMemoryUsage: Math.round(averageMemoryUsage * 100) / 100,
        peakMemoryUsage: Math.round(peakMemoryUsage * 100) / 100
      },
      operations: [...this.metrics],
      databaseQueries: [...this.dbMetrics]
    }
  }

  /**
   * Clear all collected metrics
   */
  reset(): void {
    this.metrics = []
    this.dbMetrics = []
    this.memorySnapshots = []
  }

  /**
   * Memory leak detection helper
   */
  async detectMemoryLeaks(
    operation: () => Promise<void>,
    iterations: number = 100,
    threshold: number = 10 // MB
  ): Promise<{
    hasLeak: boolean
    initialMemory: number
    finalMemory: number
    memoryGrowth: number
    iterations: number
  }> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const initialMemory = this.getCurrentMemoryUsage()
    
    for (let i = 0; i < iterations; i++) {
      await operation()
      
      // Periodic garbage collection
      if (i % 10 === 0 && global.gc) {
        global.gc()
      }
    }
    
    // Final garbage collection
    if (global.gc) {
      global.gc()
    }
    
    // Wait a bit for garbage collection to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const finalMemory = this.getCurrentMemoryUsage()
    const memoryGrowth = finalMemory - initialMemory
    
    return {
      hasLeak: memoryGrowth > threshold,
      initialMemory,
      finalMemory,
      memoryGrowth,
      iterations
    }
  }
}

/**
 * Singleton instance for global performance monitoring
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance test decorator
 */
export function measurePerformance(operationName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = async function (...args: any[]) {
      const endMeasurement = performanceMonitor.startMeasurement(operationName)
      
      try {
        const result = await originalMethod.apply(this, args)
        endMeasurement()
        return result
      } catch (error) {
        endMeasurement()
        throw error
      }
    } as T

    return descriptor
  }
}