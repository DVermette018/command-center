# Anthropic Service Documentation

## Overview
The Anthropic Service provides a robust, configurable interface for interacting with the Anthropic AI API, specifically designed for prompt enhancement and intelligent text generation.

## Key Features
- Advanced prompt enhancement
- Comprehensive error handling
- Configurable retry and circuit breaker mechanisms
- Detailed service statistics and health monitoring

## Configuration

### Environment Variables
- `ANTHROPIC_API_KEY`: **REQUIRED** Your Anthropic API key
- `NODE_ENV`: Optional environment configuration (defaults to production)

### Configuration Options
```typescript
interface AnthropicServiceConfig {
  apiKey?: string           // API key (defaults to env var)
  maxTokens?: number        // Maximum tokens per request (default: 4000)
  model?: string            // AI model to use (default: claude-3-5-sonnet-20241022)
  timeout?: number          // Request timeout in ms (default: 30000)
  maxRetries?: number       // Max retry attempts (default: 3)
  retryDelayMs?: number     // Initial retry delay (default: 1000)
  maxRetryDelayMs?: number  // Maximum retry delay (default: 30000)
}
```

## Usage Examples

### Basic Prompt Enhancement
```typescript
import { anthropicService } from './anthropic'

const originalPrompt = "Create a project plan"
const enhancedPrompt = await anthropicService.enhancePrompt(originalPrompt, {
  projectType: 'web application',
  industry: 'technology'
})
```

### Advanced Prompt Enhancement
```typescript
const result = await anthropicService.enhancePrompt({
  originalPrompt: "Design a user interface",
  context: {
    projectType: 'SaaS platform',
    audience: 'Enterprise customers'
  },
  options: {
    style: 'technical',
    focus: ['clarity', 'detail'],
    customInstructions: 'Focus on modern design principles'
  }
})

console.log(result.enhancedPrompt)
console.log(result.metadata)
```

## Error Handling
The service provides comprehensive error handling with custom error types:
- `AnthropicConfigurationError`
- `AnthropicValidationError`
- `AnthropicTimeoutError`
- `AnthropicApiError`

### Health Checking
```typescript
const healthStatus = await anthropicService.healthCheck()
console.log(healthStatus.healthy) // true/false
```

## Performance Monitoring

### Service Statistics
```typescript
const stats = anthropicService.getStats()
console.log(stats.totalRequests)
console.log(stats.successfulRequests)
console.log(stats.averageResponseTimeMs)
```

### Reset Statistics
```typescript
anthropicService.resetStats()
```

## Circuit Breaker
The service includes a circuit breaker to prevent overwhelming the API during failures:
- Tracks consecutive failures
- Temporarily disables API calls if failure threshold is exceeded
- Automatically recovers after a reset timeout

## Best Practices
1. Always set `ANTHROPIC_API_KEY` in your environment
2. Handle potential errors from the service
3. Use context and options to fine-tune prompt enhancement
4. Monitor service health and statistics

## Troubleshooting
- Ensure API key is correctly set
- Check network connectivity
- Review service statistics for potential issues
- Implement appropriate error handling in your application

## Security Considerations
- API key is never logged or exposed
- Configuration supports secure, environment-based setup
- Implements timeout and retry mechanisms to prevent API abuse

## Compliance
- Follows Anthropic's usage guidelines
- Implements rate limiting and error handling
- Supports various AI models and configurations