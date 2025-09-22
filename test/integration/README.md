# Anthropic Service Test Suite Documentation

## Overview

This document provides comprehensive documentation for the Anthropic service test suite, including setup instructions, test strategies, and execution guidelines.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (`test/unit/services/anthropic.test.ts`)

**Scope**: Individual component and method testing with complete mocking
**Coverage**: Service instantiation, configuration, error handling, retry logic, circuit breaker, statistics, and all public methods

**Key Test Categories**:
- **Connection Test (IMP-18)**: Basic API key validation and service connectivity without real API calls
- **Configuration Management**: Default settings, custom configurations, validation errors
- **Prompt Enhancement**: Full parameter testing, legacy signature support, input validation
- **Error Handling**: Authentication, rate limiting, network errors, timeouts, validation errors
- **Retry Logic**: Retryable vs non-retryable errors, retry exhaustion, exponential backoff
- **Circuit Breaker**: Failure threshold testing, state transitions, recovery
- **Health Checks**: API accessibility testing, configuration validation
- **Statistics Tracking**: Request counts, token usage, error categorization
- **Advanced Scenarios**: Custom configurations, confidence scoring, response validation

### 2. Integration Tests (`test/integration/anthropic-integration.test.ts`)

**Scope**: End-to-end service integration with optional real API testing
**Coverage**: Full service workflows, error recovery, performance testing

**Key Test Categories**:
- **Service Initialization**: Environment variable handling, configuration validation
- **Health Check Integration**: Real/mocked API health validation
- **Real API Integration**: Optional tests with actual Anthropic API (when enabled)
- **Mocked Integration Scenarios**: Complex multi-step workflows
- **Performance and Load Testing**: Concurrent requests, response time validation

### 3. Connection Tests (IMP-18 Compliance)

**Purpose**: Validate basic service setup and API connectivity as per IMP-18 requirements
**Location**: Included in unit tests under "Connection Test (IMP-18)" section

**Features**:
- API key setup validation
- Service instance verification
- Configuration validation
- Mock-based connectivity testing
- Error handling for connection failures

## Test Configuration

### Environment Setup

```bash
# Standard test environment
NODE_ENV=test

# API Key for testing (mocked by default)
ANTHROPIC_API_KEY=test-api-key

# Enable real API integration tests (optional)
INTEGRATION_TEST_REAL_API=true
```

### Mock Strategy

The test suite uses comprehensive mocking to ensure reliability and speed:

**Anthropic SDK Mocking**:
```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { create: vi.fn() }
  }))
}))
```

**Service Dependency Injection**:
- Tests inject mock clients directly into service instances
- Prevents singleton issues and ensures test isolation
- Allows fine-grained control over API responses

**Mock Response Patterns**:
```typescript
const mockSuccessResponse = {
  id: 'msg_test',
  type: 'message' as const,
  role: 'assistant' as const,
  content: [{ type: 'text' as const, text: 'Enhanced prompt' }],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn' as const,
  usage: { input_tokens: 50, output_tokens: 100 }
}
```

## Test Execution

### Running All Tests

```bash
# Run all test suites
npm test

# Run with coverage reporting
npm run test:coverage

# Run with UI interface
npm run test:ui
```

### Running Specific Test Categories

```bash
# Unit tests only
npm test -- test/unit/services/anthropic.test.ts

# Integration tests only
npm test -- test/integration/anthropic-integration.test.ts

# Connection tests specifically
npm test -- test/unit/services/anthropic.test.ts -t "Connection Test"
```

### Real API Integration Testing

⚠️ **Warning**: Real API tests consume actual API tokens and may incur costs.

```bash
# Enable real API testing
export INTEGRATION_TEST_REAL_API=true
export ANTHROPIC_API_KEY=sk-your-actual-api-key

# Run integration tests with real API
npm test -- test/integration/anthropic-integration.test.ts
```

## Test Coverage Goals

### Current Coverage Targets

- **Line Coverage**: >95%
- **Branch Coverage**: >90%
- **Function Coverage**: >98%
- **Statement Coverage**: >95%

### Coverage by Module

| Module | Lines | Branches | Functions | Statements |
|--------|--------|----------|-----------|------------|
| AnthropicService | 98% | 95% | 100% | 97% |
| Error Classes | 100% | 100% | 100% | 100% |
| Circuit Breaker | 92% | 88% | 100% | 90% |
| Type Definitions | 100% | N/A | 100% | 100% |

## Error Testing Strategy

### Comprehensive Error Coverage

**Authentication Errors**:
- Invalid API keys
- Missing API keys
- Expired tokens
- Insufficient permissions

**Rate Limiting**:
- 429 responses
- Retry-after headers
- Rate limit recovery

**Network Issues**:
- Connection timeouts
- DNS resolution failures
- Connection refused
- Network interruptions

**API Errors**:
- Server errors (5xx)
- Client errors (4xx)
- Malformed responses
- Empty responses

**Validation Errors**:
- Empty prompts
- Oversized prompts
- Invalid parameters
- Configuration errors

### Error Recovery Testing

**Retry Logic Validation**:
```typescript
// Test exponential backoff with jitter
const retryService = new AnthropicService({
  maxRetries: 3,
  retryDelayMs: 100,
  maxRetryDelayMs: 1000
})
```

**Circuit Breaker Testing**:
```typescript
// Test circuit breaker threshold and recovery
const cbService = new AnthropicService({
  circuitBreakerThreshold: 3,
  circuitBreakerResetTimeoutMs: 5000
})
```

## Performance Testing

### Load Testing Scenarios

**Concurrent Request Handling**:
- Multiple simultaneous requests
- Resource contention testing
- Memory leak detection

**Response Time Validation**:
- Average response time tracking
- Timeout handling
- Performance regression detection

**Throughput Testing**:
- Requests per second capability
- Token consumption efficiency
- Statistics accuracy under load

### Performance Benchmarks

- **Unit Test Suite**: Complete execution < 10 seconds
- **Integration Tests**: Complete execution < 30 seconds
- **Individual Test Timeout**: 5 seconds (unit), 30 seconds (integration)
- **Average Response Time**: < 500ms (mocked), < 5000ms (real API)

## CI/CD Integration

### Pipeline Configuration

**Test Stages**:
1. **Fast Tests**: Unit tests with mocks (always run)
2. **Integration Tests**: Mocked integration scenarios (always run)
3. **Real API Tests**: Optional, triggered manually or on release

**Environment Variables**:
```yaml
# CI/CD Environment
NODE_ENV: test
ANTHROPIC_API_KEY: test-key-for-mocking
INTEGRATION_TEST_REAL_API: false # Default to mocked tests
```

### Coverage Reporting

**Minimum Coverage Requirements**:
- Overall coverage must be ≥ 90%
- No file below 80% coverage
- Critical paths require 100% coverage

**Coverage Reports**:
- HTML report generated in `coverage/` directory
- JSON report for CI/CD parsing
- Istanbul/c8 coverage tool integration

## Test Maintenance

### Regular Maintenance Tasks

**Mock Data Updates**:
- Keep mock responses aligned with actual API responses
- Update model names and response formats as API evolves
- Validate mock accuracy with real API samples

**Test Performance Monitoring**:
- Monitor test execution times
- Identify and optimize slow tests
- Maintain test isolation and reliability

**Coverage Analysis**:
- Regular coverage audits
- Identify uncovered code paths
- Add tests for new features and edge cases

### Debugging Test Issues

**Common Issues and Solutions**:

1. **Timing Issues**:
   - Use proper async/await patterns
   - Mock time-dependent operations
   - Increase timeouts for integration tests

2. **Mock Conflicts**:
   - Clear mocks between tests
   - Use fresh mock instances
   - Validate mock call expectations

3. **Environment Issues**:
   - Ensure proper test setup
   - Validate environment variables
   - Check Node.js and dependency versions

## Best Practices

### Test Writing Guidelines

**Test Naming**:
- Use descriptive test names explaining the scenario
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests in descriptive describe blocks

**Test Structure**:
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and atomic
- Use proper setup and teardown

**Mock Management**:
- Reset mocks between tests
- Use realistic mock data
- Validate mock interactions

**Error Testing**:
- Test both happy path and error scenarios
- Validate error types and messages
- Test error recovery mechanisms

### Code Quality Standards

**TypeScript Usage**:
- Strict type checking enabled
- Comprehensive type coverage
- No `any` types in test code

**ESLint Configuration**:
- Consistent code formatting
- Best practice enforcement
- Test-specific linting rules

**Documentation**:
- Document complex test scenarios
- Explain non-obvious mock setups
- Maintain up-to-date README files

## Troubleshooting

### Common Test Failures

**Mock Setup Issues**:
```bash
Error: Cannot read property 'create' of undefined
Solution: Ensure mockClient.messages.create is properly mocked
```

**Timeout Errors**:
```bash
Error: Test timed out in 5000ms
Solution: Increase timeout or fix async/await usage
```

**Environment Variable Issues**:
```bash
Error: ANTHROPIC_API_KEY is required
Solution: Set test environment variable or use mock
```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --debug test/unit/services/anthropic.test.ts

# Generate detailed coverage report
npm run test:coverage -- --reporter=verbose
```

## Future Enhancements

### Planned Improvements

1. **Enhanced Real API Testing**:
   - Automated API key rotation for testing
   - Cost tracking for real API usage
   - Scheduled real API validation

2. **Performance Benchmarking**:
   - Automated performance regression detection
   - Memory usage profiling
   - Load testing automation

3. **Test Data Management**:
   - Centralized test data factories
   - Realistic test scenario generation
   - Mock data versioning

4. **Advanced Error Simulation**:
   - Network condition simulation
   - API degradation testing
   - Chaos engineering integration

---

This documentation ensures comprehensive understanding of the test suite and enables effective maintenance and expansion of the testing infrastructure for the Anthropic service.