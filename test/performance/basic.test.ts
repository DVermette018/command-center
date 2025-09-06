import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { TestDatabase } from '~~/test/helpers/test-database'
import { TestDataFactory } from '~~/test/helpers/test-data-factory'
import { PerformanceMonitor } from '~~/test/helpers/performance-monitor'
import { createTestRepositories } from '~~/test/helpers/test-repositories'

describe('Basic Performance Test', () => {
  let testDatabase: TestDatabase
  let dataFactory: TestDataFactory
  let repositories: ReturnType<typeof createTestRepositories>
  let performanceMonitor: PerformanceMonitor

  beforeAll(async () => {
    console.log('Setting up performance test...')
    testDatabase = await TestDatabase.getInstance()
    dataFactory = new TestDataFactory(testDatabase.prisma)
    repositories = createTestRepositories(testDatabase.prisma)
    performanceMonitor = new PerformanceMonitor()
    console.log('Performance test setup complete')
  }, 90000)

  afterEach(async () => {
    await testDatabase.reset()
    performanceMonitor.reset()
  })

  afterAll(async () => {
    if (testDatabase) {
      console.log('Tearing down performance test...')
      await testDatabase.teardown()
      console.log('Performance test teardown complete')
    }
  }, 60000)

  it('should measure basic customer getAll performance', async () => {
    // Create a small amount of test data
    await Promise.all([
      dataFactory.createCustomerInDb(),
      dataFactory.createCustomerInDb(),
      dataFactory.createCustomerInDb()
    ])

    const endMeasurement = performanceMonitor.startMeasurement('customers.getAll.basic')
    
    const result = await repositories.customers.getAll({
      pageIndex: 1,
      pageSize: 10
    })

    const metrics = endMeasurement()
    
    console.log('Basic performance metrics:', {
      responseTime: metrics.responseTime,
      memoryBefore: metrics.memoryBefore,
      memoryAfter: metrics.memoryAfter,
      memoryDelta: metrics.memoryDelta
    })

    expect(result.data.length).toBe(3)
    expect(result.pagination.totalCount).toBe(3)
    expect(metrics.responseTime).toBeLessThan(2000) // 2 second threshold for basic test
    expect(metrics.responseTime).toBeGreaterThan(0)
  })

  it('should measure basic customer create performance', async () => {
    const customerData = {
      status: 'LEAD' as const,
      source: 'WEBSITE' as const,
      contact: {
        email: 'basic.test@example.com',
        firstName: 'Basic',
        lastName: 'Test',
        position: 'Test Position',
        department: 'Test Department'
      },
      business: {
        businessName: 'Basic Test Business',
        category: 'Technology',
        size: 'SMALL' as const,
        address: {
          type: 'BUSINESS' as const,
          street: '123 Basic Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country',
          isPrimary: true
        }
      }
    }

    const endMeasurement = performanceMonitor.startMeasurement('customers.create.basic')
    
    const result = await repositories.customers.create(customerData)
    
    const metrics = endMeasurement()
    
    console.log('Create performance metrics:', {
      responseTime: metrics.responseTime,
      memoryDelta: metrics.memoryDelta
    })

    expect(result.businessProfile?.businessName).toBe('Basic Test Business')
    expect(metrics.responseTime).toBeLessThan(5000) // 5 second threshold for create
    expect(metrics.responseTime).toBeGreaterThan(0)
  })

  it('should run a basic load test', async () => {
    // Create some initial data
    await Promise.all([
      dataFactory.createCustomerInDb(),
      dataFactory.createCustomerInDb()
    ])

    const loadTestResult = await performanceMonitor.runLoadTest(
      'basic-load-test',
      () => repositories.customers.getAll({ pageIndex: 1, pageSize: 10 }),
      {
        concurrentUsers: 2,
        requestsPerUser: 2,
        timeout: 10000
      }
    )

    console.log('Basic load test results:', {
      totalRequests: loadTestResult.totalRequests,
      successfulRequests: loadTestResult.successfulRequests,
      failedRequests: loadTestResult.failedRequests,
      averageResponseTime: loadTestResult.averageResponseTime,
      requestsPerSecond: loadTestResult.requestsPerSecond
    })

    expect(loadTestResult.totalRequests).toBe(4)
    expect(loadTestResult.successfulRequests).toBeGreaterThan(0)
    expect(loadTestResult.averageResponseTime).toBeGreaterThan(0)
    expect(loadTestResult.requestsPerSecond).toBeGreaterThan(0)
  })

  it('should generate a performance report', async () => {
    // Run a few operations to collect metrics
    const customer = await dataFactory.createCustomerInDb()

    const endGetAll = performanceMonitor.startMeasurement('report.getAll')
    await repositories.customers.getAll({ pageIndex: 1, pageSize: 10 })
    endGetAll()

    const endGetById = performanceMonitor.startMeasurement('report.getById')
    await repositories.customers.getById(customer.id)
    endGetById()

    const report = performanceMonitor.generateReport()
    
    console.log('Performance report summary:', report.summary)

    // Check that we have at least the operations we just ran
    expect(report.summary.totalOperations).toBeGreaterThanOrEqual(2)
    expect(report.summary.averageResponseTime).toBeGreaterThan(0)
    expect(report.operations.length).toBeGreaterThanOrEqual(2)
    
    // Find our specific operations in the report
    const getAllOp = report.operations.find(op => op.operation === 'report.getAll')
    const getByIdOp = report.operations.find(op => op.operation === 'report.getById')
    
    expect(getAllOp).toBeDefined()
    expect(getByIdOp).toBeDefined()
  })
})