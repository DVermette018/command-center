# TDD Quick Reference Card

## Essential Commands
```bash
# Run single test file
npm run test path/to/file.test.ts

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Type checking
npm run typecheck
```

## Test File Template
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { expectTypeOf } from 'vitest'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks()
  })
  
  describe('methodName', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = methodUnderTest(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

## Mock Patterns

### Mock useApi (Most Common)
```typescript
vi.mock('~/api', () => ({
  useApi: vi.fn(() => ({
    customers: {
      getAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: '1' })
    }
  }))
}))
```

### Mock Vue Router
```typescript
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  })),
  useRoute: vi.fn(() => ({
    params: { id: '123' },
    query: {},
    path: '/test'
  }))
}))
```

### Mock TanStack Query
```typescript
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(() => ({
    data: ref(mockData),
    isLoading: ref(false),
    error: ref(null)
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: ref(false)
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}))
```

### Mock Nuxt App
```typescript
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $trpc: mockTrpcClient
  })),
  navigateTo: vi.fn(),
  createError: vi.fn()
}))
```

### Mock Composables
```typescript
vi.mock('~/composables/useDashboard', () => ({
  useDashboard: vi.fn(() => ({
    isNotificationsSlideoverOpen: ref(false)
  }))
}))
```

## Assertion Patterns

### Basic Assertions
```typescript
expect(value).toBe(expected)           // Exact equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()            // Truthy check
expect(value).toBeFalsy()             // Falsy check
expect(array).toContain(item)         // Array contains
expect(string).toMatch(/regex/)       // Regex match
expect(fn).toThrow('error message')   // Error throwing
```

### Async Assertions
```typescript
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow('error')
```

### Type Assertions
```typescript
expectTypeOf(result).toBeString()
expectTypeOf(result).toMatchTypeOf<ExpectedType>()
expectTypeOf(fn).parameters.toMatchTypeOf<[string, number]>()
expectTypeOf(fn).returns.toBePromise()
```

### Spy Assertions
```typescript
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('lastArg')
```

## Component Testing

### Mount Component
```typescript
import { mount } from '@vue/test-utils'

const wrapper = mount(Component, {
  props: {
    title: 'Test Title'
  },
  global: {
    stubs: {
      'NuxtLink': true,
      'UButton': true
    }
  }
})
```

### Component Assertions
```typescript
// Text content
expect(wrapper.text()).toContain('Expected text')

// Find elements
const button = wrapper.find('[data-testid="submit-btn"]')
expect(button.exists()).toBe(true)

// Props
expect(wrapper.props('title')).toBe('Test Title')

// Emitted events
await button.trigger('click')
expect(wrapper.emitted('submit')).toBeTruthy()
expect(wrapper.emitted('submit')[0]).toEqual(['payload'])

// Classes
expect(wrapper.classes()).toContain('active')

// Attributes
expect(wrapper.attributes('disabled')).toBeDefined()
```

## TDD Workflow

### Red Phase (Test First)
```typescript
// Write failing test
it('should calculate total price', () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ]
  const result = calculateTotal(items)
  expect(result).toBe(35)
})
// ❌ Test fails - function doesn't exist
```

### Green Phase (Make it Pass)
```typescript
// Write minimal code
function calculateTotal(items) {
  return items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0)
}
// ✅ Test passes
```

### Refactor Phase (Improve)
```typescript
// Refactor with confidence
interface Item {
  price: number
  quantity: number
}

export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, { price, quantity }) => 
    sum + (price * quantity), 0)
}
// ✅ Test still passes
```

## Common Testing Scenarios

### Testing Composables
```typescript
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('should increment count', () => {
    const { count, increment } = useCounter()
    expect(count.value).toBe(0)
    
    increment()
    expect(count.value).toBe(1)
  })
})
```

### Testing Services
```typescript
describe('customerService', () => {
  it('should fetch customers', async () => {
    const mockData = [{ id: '1', name: 'Test' }]
    vi.mocked(useNuxtApp).mockReturnValue({
      $trpc: {
        customers: {
          getAll: { query: vi.fn().mockResolvedValue(mockData) }
        }
      }
    })
    
    const result = await customerService.getAll()
    expect(result).toEqual(mockData)
  })
})
```

### Testing Error Cases
```typescript
it('should handle API errors gracefully', async () => {
  const error = new Error('Network error')
  mockApi.getUser.mockRejectedValue(error)
  
  await expect(fetchUser('123')).rejects.toThrow('Network error')
})
```

### Testing Validation
```typescript
import { userSchema } from './schemas'

describe('userSchema', () => {
  it('should validate valid user', () => {
    const validUser = { email: 'test@test.com', age: 25 }
    expect(() => userSchema.parse(validUser)).not.toThrow()
  })
  
  it('should reject invalid email', () => {
    const invalidUser = { email: 'not-an-email', age: 25 }
    expect(() => userSchema.parse(invalidUser)).toThrow()
  })
})
```

## Coverage Requirements

```bash
# Check coverage
npm run test:coverage

# Coverage thresholds (configured in vitest.config.ts)
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%
```

## Debugging Tests

```typescript
// Add console logs
it('should debug', () => {
  const result = complexFunction()
  console.log('Result:', result)
  expect(result).toBeDefined()
})

// Use debugger
it('should debug with breakpoint', () => {
  debugger // Set breakpoint here
  const result = complexFunction()
  expect(result).toBeDefined()
})

// Run single test
it.only('run only this test', () => {
  // This test runs in isolation
})

// Skip test
it.skip('skip this test', () => {
  // This test is skipped
})
```

## File Naming Convention
```
/app/utils/index.ts         → /app/utils/index.test.ts
/server/repos/user.ts       → /server/repos/user.test.ts
/components/UserCard.vue    → /components/UserCard.test.ts
```

## Test Data Factories
```typescript
// Create reusable test data
const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@test.com',
  ...overrides
})

// Use in tests
it('should display user', () => {
  const user = createMockUser({ name: 'John' })
  // ...
})
```

## Remember

1. **Test behavior, not implementation**
2. **One assertion per test (when possible)**
3. **Use descriptive test names**
4. **Keep tests independent**
5. **Mock at boundaries only**
6. **Clean up after tests**
7. **Test edge cases**
8. **Write test first (TDD)**
9. **Keep tests simple**
10. **Run tests frequently**

## Red Flags to Avoid

❌ Testing implementation details
❌ Mocking everything
❌ Complex test setup
❌ Dependent tests
❌ Ignoring async behavior
❌ No error case tests
❌ No type safety tests
❌ Tests that sometimes fail
❌ Tests without assertions
❌ Commented out tests