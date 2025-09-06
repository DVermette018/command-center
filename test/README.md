# Test Suite Documentation

This documentation covers the comprehensive testing framework implemented for IMP-12: API Integration Tests.

## Test Structure

```
test/
├── integration/
│   ├── api/                          # tRPC API integration tests
│   │   ├── customers.integration.test.ts
│   │   ├── business.integration.test.ts
│   │   └── error-handling.integration.test.ts
│   └── repositories/                 # Repository layer integration tests
│       ├── customers.repository.integration.test.ts
│       └── business.repository.integration.test.ts
├── performance/                      # Performance and load tests
│   ├── load.test.ts
│   ├── basic.test.ts
│   └── README.md
├── helpers/                          # Test utilities and helpers
│   ├── test-database.ts             # Database management for tests
│   ├── test-data-factory.ts         # Test data generation
│   ├── test-repositories.ts         # Repository helpers for testing
│   └── performance-monitor.ts       # Performance monitoring utilities
├── setup.ts                         # Unit test setup
├── setup-integration.ts             # Integration test setup
└── README.md                        # This file
```

## Test Types

### 1. Unit Tests
- **Location**: Alongside source files (`*.test.ts`)
- **Purpose**: Test individual functions and components in isolation
- **Database**: Mocked repositories and Prisma client
- **Command**: `pnpm test:run`

### 2. Integration Tests
- **Location**: `test/integration/`
- **Purpose**: Test complete workflows with real database interactions
- **Database**: MySQL testcontainers for isolated testing
- **Command**: `pnpm test:integration`

### 3. Performance Tests
- **Location**: `test/performance/`
- **Purpose**: Validate performance benchmarks and load testing
- **Database**: Real database with large datasets
- **Command**: `pnpm test:performance`

## Test Commands

```bash
# Run all unit tests
pnpm test:run

# Run unit tests with coverage
pnpm test:coverage

# Run unit tests with UI
pnpm test:ui

# Run integration tests
pnpm test:integration

# Run integration tests in watch mode
pnpm test:integration:watch

# Run performance tests
pnpm test:performance

# Run performance tests in watch mode
pnpm test:performance:watch

# Run all test suites
pnpm test:all

# CI-specific test command
pnpm ci:test
```

## Environment Variables

Create a `.env.test` file with:

```env
# Test database URL (used by testcontainers)
TEST_DATABASE_URL=mysql://root:password@localhost:3306/test_db

# Node environment
NODE_ENV=test
```

## Test Database Setup

### Testcontainers (Integration & Performance Tests)
- Uses MySQL testcontainers for isolated database testing
- Automatically starts/stops MySQL container for each test run
- Runs database migrations and seeds test data
- Cleans database state between tests

### Mock Database (Unit Tests)
- Uses Vitest mocks for Prisma client
- Fast execution without database overhead
- Focused on business logic testing

## Test Data Generation

The `TestDataFactory` class provides realistic test data generation using Faker.js:

```typescript
const factory = new TestDataFactory(prismaClient)

// Generate customer data
const customer = await factory.createCustomer()

// Generate business profile data
const business = await factory.createBusinessProfile(customerId)

// Generate large datasets for performance testing
const customers = await factory.createManyCustomers(1000)
```

## Performance Testing

Performance tests validate:

- Response time thresholds (< 500ms for simple operations)
- Memory usage limits (< 200MB)
- Throughput requirements (> 10 RPS)
- Concurrent user handling (up to 100 users)
- Database query performance (< 300ms)

### Performance Metrics

```typescript
const metrics = await performanceMonitor.measureOperation(async () => {
  return await customerAPI.getAll({ pageIndex: 1, pageSize: 10 })
})

// Returns: { responseTime, memoryBefore, memoryAfter, memoryDelta }
```

## Error Handling Tests

Comprehensive error scenarios tested:

- Database constraint violations
- Input validation errors
- Business logic violations
- Network and infrastructure errors
- tRPC-specific error handling
- Concurrent operation conflicts

## CI/CD Integration

### GitHub Actions Workflow

The test suite runs automatically on:

- Push to `main`, `develop`, or `feat/*` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Unit Tests**: Fast feedback with mocked dependencies
2. **Integration Tests**: Full workflow testing with MySQL service
3. **Performance Tests**: Performance benchmarks (main/develop only)
4. **Lint & TypeCheck**: Code quality validation

### Test Coverage

Target coverage thresholds:
- Global: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Data
- Use factories for consistent test data generation
- Clean database state between tests
- Avoid hardcoded test data

### Performance Testing
- Set realistic performance thresholds
- Monitor memory usage for leak detection
- Test with production-like data volumes

### Error Testing
- Test both expected and unexpected error scenarios
- Validate error messages and codes
- Ensure graceful error handling

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Ensure Docker is running for testcontainers
   - Check MySQL container health status

2. **Test Isolation Issues**
   - Verify database cleanup between tests
   - Check for async operation completion

3. **Performance Test Failures**
   - Adjust thresholds for CI environment
   - Monitor system resources during tests

4. **Integration Test Setup Issues**
   - Verify Prisma schema is up to date
   - Check database migration status

### Debug Commands

```bash
# Run tests with debug output
DEBUG=testcontainers* pnpm test:integration

# Run specific test file
pnpm test:integration -- customers.integration.test.ts

# Run tests with increased timeout
pnpm test:integration -- --timeout 60000
```

## Contributing

When adding new tests:

1. Follow existing patterns and naming conventions
2. Include both success and error scenarios
3. Add performance considerations for new endpoints
4. Update documentation for new test utilities
5. Ensure tests are isolated and deterministic

## Test Metrics

Current test coverage (as of implementation):

- **Unit Tests**: 307 passing tests
- **Integration Tests**: Comprehensive API and repository coverage
- **Error Handling**: 49 comprehensive error scenarios
- **Performance Tests**: Baseline and load testing scenarios

The test suite provides confidence in the system's reliability, performance, and maintainability.