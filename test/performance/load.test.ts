import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { createCaller } from '~~/server/api/trpc/init'
import { TestDatabase } from '~~/test/helpers/test-database'
import { TestDataFactory } from '~~/test/helpers/test-data-factory'
import { PerformanceMonitor, LoadTestResult } from '~~/test/helpers/performance-monitor'

describe('Performance and Load Testing Suite', () => {
  let testDatabase: TestDatabase
  let dataFactory: TestDataFactory
  let caller: ReturnType<typeof createCaller>
  let performanceMonitor: PerformanceMonitor

  // Performance thresholds
  const PERFORMANCE_THRESHOLDS = {
    SIMPLE_OPERATION_MAX_TIME: 500, // ms
    COMPLEX_OPERATION_MAX_TIME: 2000, // ms
    PAGINATION_MAX_TIME: 1000, // ms
    SEARCH_MAX_TIME: 1500, // ms
    DATABASE_QUERY_MAX_TIME: 300, // ms
    MAX_MEMORY_USAGE: 200, // MB
    MIN_REQUESTS_PER_SECOND: 10,
    MAX_FAILURE_RATE: 5 // percent
  }

  beforeAll(async () => {
    testDatabase = await TestDatabase.getInstance()
    dataFactory = new TestDataFactory(testDatabase.prisma)
    caller = createCaller({ prisma: testDatabase.prisma })
    performanceMonitor = new PerformanceMonitor()
  }, 60000) // 60 second timeout for database setup

  afterEach(async () => {
    await testDatabase.reset()
    performanceMonitor.reset()
  })

  afterAll(async () => {
    if (testDatabase) {
      await testDatabase.teardown()
    }
  }, 30000) // 30 second timeout for teardown

  describe('Baseline Performance Tests', () => {
    describe('Customer API Performance', () => {
      it('should meet performance requirements for getAll operation', async () => {
        // Create test data
        await performanceMonitor.generateLargeDataset(
          () => dataFactory.createCustomerInDb(),
          50,
          10
        )

        const endMeasurement = performanceMonitor.startMeasurement('customers.getAll')
        
        const result = await caller.customers.getAll({
          pageIndex: 1,
          pageSize: 10
        })

        const metrics = endMeasurement()
        
        expect(result.data.length).toBe(10)
        expect(result.totalCount).toBe(50)
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME,
          maxMemoryUsage: PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE
        })
      })

      it('should meet performance requirements for getById operation', async () => {
        const customer = await dataFactory.createCustomerInDb()

        const endMeasurement = performanceMonitor.startMeasurement('customers.getById')
        
        const result = await caller.customers.getById({ id: customer.id })
        
        const metrics = endMeasurement()
        
        expect(result.id).toBe(customer.id)
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME
        })
      })

      it('should meet performance requirements for create operation', async () => {
        const customerData = {
          status: 'LEAD' as const,
          source: 'WEBSITE' as const,
          contact: {
            email: 'performance.test@example.com',
            firstName: 'Performance',
            lastName: 'Test',
            position: 'Test Position',
            department: 'Test Department'
          },
          business: {
            businessName: 'Performance Test Business',
            category: 'Technology',
            size: 'SMALL' as const,
            address: {
              type: 'BUSINESS' as const,
              street: '123 Performance St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'Test Country',
              isPrimary: true
            }
          }
        }

        const endMeasurement = performanceMonitor.startMeasurement('customers.create')
        
        const result = await caller.customers.create(customerData)
        
        const metrics = endMeasurement()
        
        expect(result.businessProfile?.businessName).toBe('Performance Test Business')
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.COMPLEX_OPERATION_MAX_TIME
        })
      })

      it('should meet performance requirements for update operation', async () => {
        const customer = await dataFactory.createCustomerInDb()

        const endMeasurement = performanceMonitor.startMeasurement('customers.update')
        
        const result = await caller.customers.update({
          id: customer.id,
          status: 'ACTIVE'
        })
        
        const metrics = endMeasurement()
        
        expect(result.status).toBe('ACTIVE')
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME
        })
      })

      it('should meet performance requirements for search operation', async () => {
        // Create customers with searchable data
        await Promise.all([
          dataFactory.createCustomerInDb(),
          dataFactory.createCustomerInDb(),
          dataFactory.createCustomerInDb()
        ])

        const endMeasurement = performanceMonitor.startMeasurement('customers.search')
        
        const result = await caller.customers.search({
          query: 'LEAD',
          pageIndex: 1,
          pageSize: 10
        })
        
        const metrics = endMeasurement()
        
        expect(result.data.length).toBeGreaterThan(0)
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SEARCH_MAX_TIME
        })
      })
    })

    describe('Business API Performance', () => {
      it('should meet performance requirements for business getAll', async () => {
        // Create customers with business profiles
        await performanceMonitor.generateLargeDataset(
          () => dataFactory.createCustomerInDb(),
          30,
          10
        )

        const endMeasurement = performanceMonitor.startMeasurement('business.getAll')
        
        const result = await caller.business.getAll({
          pageIndex: 1,
          pageSize: 10
        })
        
        const metrics = endMeasurement()
        
        expect(result.data.length).toBeLessThanOrEqual(10)
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME
        })
      })

      it('should meet performance requirements for business search', async () => {
        // Create customers with business profiles
        await Promise.all([
          dataFactory.createCustomerInDb(),
          dataFactory.createCustomerInDb(),
          dataFactory.createCustomerInDb()
        ])

        const endMeasurement = performanceMonitor.startMeasurement('business.search')
        
        const result = await caller.business.search({
          query: 'technology',
          pageIndex: 1,
          pageSize: 10
        })
        
        const metrics = endMeasurement()
        
        performanceMonitor.assertPerformance(metrics, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SEARCH_MAX_TIME
        })
      })
    })
  })

  describe('Load Testing Scenarios', () => {
    describe('Customer API Load Tests', () => {
      it('should handle concurrent getAll requests (5 users)', async () => {
        // Setup test data
        await performanceMonitor.generateLargeDataset(
          () => dataFactory.createCustomerInDb(),
          100,
          20
        )

        const loadTestResult = await performanceMonitor.runLoadTest(
          'customers.getAll - 5 concurrent users',
          () => caller.customers.getAll({ pageIndex: 1, pageSize: 10 }),
          {
            concurrentUsers: 5,
            requestsPerUser: 10,
            timeout: 10000
          }
        )

        console.log('Load Test Results:', JSON.stringify(loadTestResult, null, 2))

        performanceMonitor.assertPerformance(loadTestResult, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME,
          minRequestsPerSecond: PERFORMANCE_THRESHOLDS.MIN_REQUESTS_PER_SECOND,
          maxFailureRate: PERFORMANCE_THRESHOLDS.MAX_FAILURE_RATE
        })

        expect(loadTestResult.successfulRequests).toBe(50)
        expect(loadTestResult.failedRequests).toBe(0)
      })

      it('should handle concurrent getAll requests (10 users)', async () => {
        // Setup test data
        await performanceMonitor.generateLargeDataset(
          () => dataFactory.createCustomerInDb(),
          200,
          25
        )

        const loadTestResult = await performanceMonitor.runLoadTest(
          'customers.getAll - 10 concurrent users',
          () => caller.customers.getAll({ pageIndex: 1, pageSize: 20 }),
          {
            concurrentUsers: 10,
            requestsPerUser: 5,
            timeout: 15000
          }
        )

        console.log('Load Test Results (10 users):', JSON.stringify(loadTestResult, null, 2))

        performanceMonitor.assertPerformance(loadTestResult, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME * 1.5, // Allow 50% more time under load
          minRequestsPerSecond: PERFORMANCE_THRESHOLDS.MIN_REQUESTS_PER_SECOND / 2, // Expect lower RPS under higher load
          maxFailureRate: PERFORMANCE_THRESHOLDS.MAX_FAILURE_RATE
        })

        expect(loadTestResult.totalRequests).toBe(50)
        expect(loadTestResult.failedRequests).toBeLessThanOrEqual(2) // Allow some failures under load
      })

      it('should handle concurrent create operations (5 users)', async () => {
        let counter = 0

        const loadTestResult = await performanceMonitor.runLoadTest(
          'customers.create - 5 concurrent users',
          async () => {
            counter++
            return caller.customers.create({
              status: 'LEAD' as const,
              source: 'WEBSITE' as const,
              contact: {
                email: `load.test.${counter}@example.com`,
                firstName: 'Load',
                lastName: `Test${counter}`,
                position: 'Test Position',
                department: 'Test Department'
              },
              business: {
                businessName: `Load Test Business ${counter}`,
                category: 'Technology',
                size: 'SMALL' as const,
                address: {
                  type: 'BUSINESS' as const,
                  street: `${counter} Load Test St`,
                  city: 'Test City',
                  state: 'Test State',
                  zipCode: '12345',
                  country: 'Test Country',
                  isPrimary: true
                }
              }
            })
          },
          {
            concurrentUsers: 5,
            requestsPerUser: 3,
            timeout: 20000
          }
        )

        console.log('Create Load Test Results:', JSON.stringify(loadTestResult, null, 2))

        performanceMonitor.assertPerformance(loadTestResult, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.COMPLEX_OPERATION_MAX_TIME * 1.5,
          maxFailureRate: PERFORMANCE_THRESHOLDS.MAX_FAILURE_RATE
        })

        expect(loadTestResult.totalRequests).toBe(15)
      })

      it('should handle mixed operation load (read/write)', async () => {
        // Setup initial data
        const customers = await performanceMonitor.generateLargeDataset(
          () => dataFactory.createCustomerInDb(),
          50,
          10
        )

        let operationCounter = 0

        const loadTestResult = await performanceMonitor.runLoadTest(
          'customers - mixed operations',
          async () => {
            operationCounter++
            const operation = operationCounter % 4

            switch (operation) {
              case 0:
                return caller.customers.getAll({ pageIndex: 1, pageSize: 10 })
              case 1:
                const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
                return caller.customers.getById({ id: randomCustomer.id })
              case 2:
                return caller.customers.search({
                  query: 'LEAD',
                  pageIndex: 1,
                  pageSize: 10
                })
              case 3:
                const customerToUpdate = customers[Math.floor(Math.random() * customers.length)]
                return caller.customers.update({
                  id: customerToUpdate.id,
                  status: Math.random() > 0.5 ? 'ACTIVE' : 'LEAD'
                })
              default:
                return caller.customers.getAll({ pageIndex: 1, pageSize: 10 })
            }
          },
          {
            concurrentUsers: 8,
            requestsPerUser: 5,
            timeout: 15000
          }
        )

        console.log('Mixed Operations Load Test:', JSON.stringify(loadTestResult, null, 2))

        performanceMonitor.assertPerformance(loadTestResult, {
          maxResponseTime: PERFORMANCE_THRESHOLDS.COMPLEX_OPERATION_MAX_TIME,
          maxFailureRate: PERFORMANCE_THRESHOLDS.MAX_FAILURE_RATE * 2 // Allow higher failure rate for mixed ops
        })

        expect(loadTestResult.totalRequests).toBe(40)
      })
    })
  })

  describe('Database Performance Tests', () => {
    it('should meet performance requirements for large dataset pagination', async () => {
      // Create large dataset
      await performanceMonitor.generateLargeDataset(
        () => dataFactory.createCustomerInDb(),
        1000,
        50
      )

      const { result, metrics } = await performanceMonitor.measureDatabaseQuery(
        'customer pagination - 1000 records',
        () => testDatabase.prisma.customer.findMany({
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' }
        }),
        1000
      )

      expect(result.length).toBe(50)
      expect(metrics.queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MAX_TIME)
    })

    it('should meet performance requirements for complex search queries', async () => {
      // Create diverse test data
      await Promise.all([
        dataFactory.createCustomerInDb(),
        dataFactory.createCustomerInDb(),
        dataFactory.createCustomerInDb()
      ])

      const { result, metrics } = await performanceMonitor.measureDatabaseQuery(
        'customer complex search',
        () => testDatabase.prisma.customer.findMany({
          where: {
            OR: [
              {
                businessProfile: {
                  businessName: {
                    contains: 'test',
                    mode: 'insensitive'
                  }
                }
              },
              {
                contacts: {
                  some: {
                    user: {
                      email: {
                        contains: '@',
                        mode: 'insensitive'
                      }
                    }
                  }
                }
              }
            ]
          },
          include: {
            businessProfile: true,
            contacts: {
              include: {
                user: true
              }
            }
          }
        })
      )

      expect(metrics.queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MAX_TIME * 2) // Complex queries can take longer
    })

    it('should handle concurrent database operations', async () => {
      const concurrentQueries = Array.from({ length: 10 }, (_, i) =>
        performanceMonitor.measureDatabaseQuery(
          `concurrent query ${i}`,
          () => testDatabase.prisma.customer.count(),
          0
        )
      )

      const results = await Promise.all(concurrentQueries)

      results.forEach(({ metrics }, index) => {
        expect(metrics.queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MAX_TIME)
      })

      // All queries should return the same count (assuming no concurrent modifications)
      const counts = results.map(({ result }) => result)
      expect(new Set(counts).size).toBeLessThanOrEqual(2) // Allow for small variations due to timing
    })
  })

  describe('Memory Usage and Leak Detection', () => {
    it('should not have memory leaks in customer operations', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const memoryLeakTest = await performanceMonitor.detectMemoryLeaks(
        async () => {
          await caller.customers.getById({ id: customer.id })
          await caller.customers.getAll({ pageIndex: 1, pageSize: 10 })
        },
        50,
        5 // 5MB threshold
      )

      console.log('Memory Leak Test Results:', memoryLeakTest)

      expect(memoryLeakTest.hasLeak).toBe(false)
      expect(memoryLeakTest.memoryGrowth).toBeLessThan(10) // Should not grow more than 10MB
    })

    it('should not have memory leaks in create operations', async () => {
      let counter = 0

      const memoryLeakTest = await performanceMonitor.detectMemoryLeaks(
        async () => {
          counter++
          await dataFactory.createCustomerInDb({
            source: 'WEBSITE'
          })
        },
        20,
        15 // Higher threshold for create operations
      )

      console.log('Create Memory Leak Test:', memoryLeakTest)

      expect(memoryLeakTest.hasLeak).toBe(false)
    })

    it('should monitor memory usage during load testing', async () => {
      const initialMemory = performanceMonitor.getCurrentMemoryUsage()

      // Setup test data
      await performanceMonitor.generateLargeDataset(
        () => dataFactory.createCustomerInDb(),
        100,
        25
      )

      const loadTestResult = await performanceMonitor.runLoadTest(
        'memory monitoring test',
        () => caller.customers.getAll({ pageIndex: 1, pageSize: 20 }),
        {
          concurrentUsers: 10,
          requestsPerUser: 3,
          timeout: 10000
        }
      )

      console.log('Memory Usage During Load Test:', {
        initial: initialMemory,
        loadTest: loadTestResult.memoryUsage,
        growth: loadTestResult.memoryUsage.peak - initialMemory
      })

      // Memory should not grow excessively during load testing
      expect(loadTestResult.memoryUsage.peak - initialMemory).toBeLessThan(50) // 50MB limit
      expect(loadTestResult.memoryUsage.final - initialMemory).toBeLessThan(25) // Should mostly return to baseline
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      await performanceMonitor.generateLargeDataset(
        () => dataFactory.createCustomerInDb(),
        50,
        10
      )

      const runs: LoadTestResult[] = []

      // Run the same test multiple times
      for (let i = 0; i < 3; i++) {
        const result = await performanceMonitor.runLoadTest(
          `consistency test run ${i + 1}`,
          () => caller.customers.getAll({ pageIndex: 1, pageSize: 10 }),
          {
            concurrentUsers: 5,
            requestsPerUser: 4,
            timeout: 10000
          }
        )
        runs.push(result)
      }

      // Calculate performance stability
      const averageResponseTimes = runs.map(r => r.averageResponseTime)
      const p95ResponseTimes = runs.map(r => r.p95ResponseTime)
      
      const avgResponseTimeStdDev = calculateStandardDeviation(averageResponseTimes)
      const p95ResponseTimeStdDev = calculateStandardDeviation(p95ResponseTimes)

      console.log('Performance Consistency Results:', {
        averageResponseTimes,
        p95ResponseTimes,
        avgResponseTimeStdDev,
        p95ResponseTimeStdDev
      })

      // Performance should be consistent (low standard deviation)
      expect(avgResponseTimeStdDev).toBeLessThan(50) // Less than 50ms std dev
      expect(p95ResponseTimeStdDev).toBeLessThan(100) // Less than 100ms std dev for p95

      // All runs should meet basic performance requirements
      runs.forEach((run, index) => {
        expect(run.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SIMPLE_OPERATION_MAX_TIME)
        expect(run.failedRequests).toBe(0)
      })
    })
  })

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      // Run various operations to collect metrics
      const customer = await dataFactory.createCustomerInDb()
      
      // Single operations
      const endGetAll = performanceMonitor.startMeasurement('report.getAll')
      await caller.customers.getAll({ pageIndex: 1, pageSize: 10 })
      endGetAll()

      const endGetById = performanceMonitor.startMeasurement('report.getById')
      await caller.customers.getById({ id: customer.id })
      endGetById()

      // Database operations
      await performanceMonitor.measureDatabaseQuery(
        'report.database.count',
        () => testDatabase.prisma.customer.count()
      )

      const report = performanceMonitor.generateReport()
      
      console.log('Performance Report:', JSON.stringify(report, null, 2))

      expect(report.summary.totalOperations).toBeGreaterThan(0)
      expect(report.summary.totalDatabaseQueries).toBeGreaterThan(0)
      expect(report.summary.averageResponseTime).toBeGreaterThan(0)
      expect(report.operations.length).toBeGreaterThan(0)
      expect(report.databaseQueries.length).toBeGreaterThan(0)
    })
  })
})

// Utility function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squareDiffs = values.map(val => Math.pow(val - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
  
  return Math.sqrt(avgSquareDiff)
}