# Performance Testing Framework

This directory contains comprehensive performance and load testing utilities for the API integration tests as part of IMP-12.

## Overview

The performance testing framework provides:

- **Performance Monitoring**: Real-time metrics collection for response times, memory usage, and database query performance
- **Load Testing**: Concurrent user simulation to test system behavior under load
- **Memory Leak Detection**: Automated detection of memory leaks in operations
- **Performance Regression Detection**: Consistent performance monitoring across multiple test runs
- **Comprehensive Reporting**: Detailed performance reports with percentile analysis

## Files Structure

```
test/performance/
├── README.md                    # This documentation
├── load.test.ts                # Main load testing suite
test/helpers/
├── performance-monitor.ts       # Performance monitoring utilities
└── test-data-factory.ts        # Enhanced with performance testing utilities
```

## Quick Start

### Running Performance Tests

```bash
# Run all performance tests
pnpm test:performance

# Run performance tests in watch mode
pnpm test:performance:watch

# Run performance tests with integration tests
pnpm test:integration
```

### Basic Usage

```typescript
import { PerformanceMonitor } from '~~/test/helpers/performance-monitor'

const monitor = new PerformanceMonitor()

// Measure single operation
const endMeasurement = monitor.startMeasurement('operation-name')
await someOperation()
const metrics = endMeasurement()

// Run load test
const loadResult = await monitor.runLoadTest(
  'test-name',
  () => someOperation(),
  {
    concurrentUsers: 5,
    requestsPerUser: 10,
    timeout: 10000
  }
)
```

## Performance Thresholds

The framework includes predefined performance thresholds:

- **Simple Operations**: < 500ms response time
- **Complex Operations**: < 2000ms response time
- **Pagination**: < 1000ms response time
- **Search Operations**: < 1500ms response time
- **Database Queries**: < 300ms response time
- **Memory Usage**: < 200MB peak usage
- **Min Requests/Second**: > 10 RPS
- **Max Failure Rate**: < 5%

## Test Categories

### 1. Baseline Performance Tests

Tests individual operations against performance thresholds:
- Customer API endpoints (getAll, getById, create, update, delete, search)
- Business API endpoints
- Database operations

### 2. Load Testing Scenarios

Tests system behavior under concurrent load:
- 5 concurrent users
- 10 concurrent users
- 50 concurrent users (stress test)
- 100 concurrent users (maximum load)
- Mixed operation patterns

### 3. Database Performance Tests

Tests database-specific performance:
- Large dataset pagination (1000+ records)
- Complex search queries
- Concurrent database operations
- Index utilization

### 4. Memory Usage Tests

Tests memory behavior:
- Memory leak detection
- Memory usage during load testing
- Memory growth monitoring
- Garbage collection effectiveness

### 5. Performance Regression Detection

Tests consistency:
- Multiple run comparisons
- Performance stability metrics
- Standard deviation analysis
- Baseline drift detection

## Performance Metrics

### Single Operation Metrics

```typescript
interface PerformanceMetrics {
  responseTime: number        // Operation duration in ms
  memoryBefore: number       // Memory before operation (MB)
  memoryAfter: number        // Memory after operation (MB)
  memoryDelta: number        // Memory change (MB)
  timestamp: number          // When the operation occurred
  operation: string          // Operation identifier
}
```

### Load Test Results

```typescript
interface LoadTestResult {
  operationName: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p50ResponseTime: number    // 50th percentile
  p95ResponseTime: number    // 95th percentile
  p99ResponseTime: number    // 99th percentile
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
```

## Advanced Features

### Memory Leak Detection

```typescript
const leakTest = await monitor.detectMemoryLeaks(
  async () => {
    // Operation to test
    await someOperation()
  },
  100,  // iterations
  5     // threshold in MB
)

console.log('Has leak:', leakTest.hasLeak)
console.log('Memory growth:', leakTest.memoryGrowth, 'MB')
```

### Database Performance Monitoring

```typescript
const { result, metrics } = await monitor.measureDatabaseQuery(
  'complex-query',
  () => prisma.customer.findMany({
    where: complexWhereClause,
    include: complexIncludes
  }),
  1000 // expected record count
)
```

### Large Dataset Generation

```typescript
// Generate large datasets efficiently
const customers = await dataFactory.createCustomerBatch(1000, 50)
const completeCustomers = await dataFactory.createCompleteCustomerBatch(500, 25)
const searchData = await dataFactory.createSearchTestData()
```

### Performance Assertions

```typescript
// Assert performance meets requirements
monitor.assertPerformance(metrics, {
  maxResponseTime: 500,
  maxMemoryUsage: 100,
  minRequestsPerSecond: 20,
  maxFailureRate: 2
})
```

## Best Practices

### 1. Test Isolation
- Each test should clean up after itself
- Use `afterEach` to reset database state
- Reset performance monitor between tests

### 2. Realistic Load Testing
- Use realistic user behavior patterns
- Include appropriate delays between operations
- Test with production-like data volumes

### 3. Threshold Setting
- Set thresholds based on actual requirements
- Allow for some variance in performance
- Update thresholds as system evolves

### 4. Error Handling
- Expect some failures under extreme load
- Log and analyze failure patterns
- Distinguish between performance issues and bugs

### 5. Resource Management
- Monitor database connection usage
- Clean up test data promptly
- Use appropriate batch sizes

## Troubleshooting

### Common Issues

**Slow Test Execution**
- Check database connection pool settings
- Ensure proper test data cleanup
- Consider reducing test dataset sizes for development

**Memory Issues**
- Enable garbage collection: `node --expose-gc`
- Monitor for unclosed database connections
- Check for retained object references

**Flaky Performance Tests**
- Performance tests can be sensitive to system load
- Use retry mechanisms for critical tests
- Set reasonable variance thresholds

**Database Timeouts**
- Increase timeout values for complex operations
- Optimize database queries
- Check database server resources

### Performance Analysis

**Response Time Analysis**
```typescript
// Look at percentiles, not just averages
console.log('P50:', result.p50ResponseTime)
console.log('P95:', result.p95ResponseTime)
console.log('P99:', result.p99ResponseTime)
```

**Memory Analysis**
```typescript
// Track memory patterns
console.log('Memory growth:', result.memoryUsage.peak - result.memoryUsage.initial)
console.log('Memory returned:', result.memoryUsage.peak - result.memoryUsage.final)
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Performance Tests
  run: pnpm test:performance
  env:
    NODE_ENV: test
    
- name: Upload Performance Results
  uses: actions/upload-artifact@v3
  with:
    name: performance-results
    path: performance-results.json
```

### Performance Monitoring

- Set up alerts for performance degradation
- Track performance trends over time
- Include performance tests in PR checks
- Generate performance reports for releases

## Contributing

When adding new performance tests:

1. Follow existing naming conventions
2. Include appropriate performance thresholds
3. Add documentation for complex test scenarios
4. Consider both single-user and load testing scenarios
5. Update this README if adding new features

## Examples

See `load.test.ts` for comprehensive examples of:
- Baseline performance testing
- Load testing scenarios  
- Database performance testing
- Memory usage monitoring
- Performance regression detection
- Report generation