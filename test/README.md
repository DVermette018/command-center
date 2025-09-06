# Testing Infrastructure

This directory contains the comprehensive testing setup for the Nuxt 3 CRM application.

## Overview

The testing infrastructure is built using:
- **Vitest** for test running and assertions
- **@vue/test-utils** for Vue component testing
- **@testing-library/vue** for accessible component testing
- **@nuxt/test-utils** for Nuxt-specific testing utilities
- **Happy-DOM** for fast DOM environment
- **@faker-js/faker** for generating test data
- **vitest-mock-extended** for advanced mocking

## Directory Structure

```
test/
├── setup.ts                 # Global test setup and configuration
├── utils/
│   └── index.ts             # Testing utility functions and helpers
├── factories/
│   └── index.ts             # Data factory functions for creating mock data
├── mocks/
│   └── nuxt.ts              # Nuxt-specific mocks and stubs
├── components/              # Component tests
├── composables/             # Composable tests
├── pages/                   # Page component tests
├── api/                     # API client tests
└── integration/             # Integration tests
```

## Test Scripts

The following npm scripts are available:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Open Vitest UI for interactive testing
pnpm test:ui
```

## Writing Tests

### Component Tests

Component tests should focus on:
- Rendering behavior
- User interactions
- Props validation
- Event emissions
- Accessibility

Example:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { mountComponent } from '~/test/utils'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mountComponent(MyComponent, {
      props: { title: 'Test Title' }
    })
    
    expect(wrapper.text()).toContain('Test Title')
  })
})
```

### Composable Tests

Test Vue composables by focusing on:
- Return values and reactivity
- Side effects
- Error handling
- State management

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { useMyComposable } from '~/composables/useMyComposable'

describe('useMyComposable', () => {
  it('returns expected values', () => {
    const { data, loading } = useMyComposable()
    
    expect(data.value).toBe(null)
    expect(loading.value).toBe(false)
  })
})
```

### API Tests

Test API clients with:
- Success scenarios
- Error handling
- Request parameters
- Response validation

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { mockFetchResponse } from '~/test/utils'
import { CustomersAPI } from '~/api/customers'

describe('CustomersAPI', () => {
  it('fetches customers successfully', async () => {
    mockFetchResponse({ customers: [] })
    
    const api = new CustomersAPI()
    const result = await api.getAll()
    
    expect(result.customers).toEqual([])
  })
})
```

### Integration Tests

Integration tests verify:
- Component workflows
- User journeys
- API integration
- State management flows

## Testing Utilities

### mountComponent

Enhanced mount function with common setup:
```typescript
const wrapper = mountComponent(Component, {
  props: { ... },
  global: {
    stubs: { ... },
    mocks: { ... }
  }
})
```

### Mock Functions

- `mockFetchResponse(data, status)` - Mock successful API responses
- `mockFetchError(status, message)` - Mock API errors
- `mockSuccessfulFetch(data)` - Mock useFetch success
- `mockFetchError(error)` - Mock useFetch error

### Data Factories

Generate consistent test data:
```typescript
import { createMockCustomer, createMockProject } from '~/test/factories'

const customer = createMockCustomer({ name: 'Test Company' })
const project = createMockProject({ status: 'active' })
```

### Accessibility Helpers

- `getByRole(wrapper, 'button')` - Find by ARIA role
- `getByLabelText(wrapper, 'Email')` - Find by label text
- `getByTestId(wrapper, 'submit-btn')` - Find by test ID

## Mocking Strategy

### Nuxt Composables

Most Nuxt composables are pre-mocked in `test/mocks/nuxt.ts`:
- `useRoute()` / `useRouter()`
- `useFetch()` / `$fetch`
- `useAsyncData()` / `useLazyAsyncData()`
- `useRuntimeConfig()`
- `navigateTo()`

### External Dependencies

Mock external libraries as needed:
```typescript
vi.mock('external-library', () => ({
  someFunction: vi.fn()
}))
```

### Component Dependencies

Use stubs for complex child components:
```typescript
const wrapper = mountComponent(ParentComponent, {
  global: {
    stubs: {
      ComplexChildComponent: { template: '<div>Stubbed</div>' }
    }
  }
})
```

## Coverage Configuration

Coverage thresholds are set at 80% for:
- Branches
- Functions
- Lines
- Statements

Files excluded from coverage:
- Configuration files
- Type definitions
- Test files
- Generated files (.nuxt/, .output/)

## Best Practices

### Test Organization

1. **Arrange, Act, Assert** - Structure tests clearly
2. **One assertion per test** - Keep tests focused
3. **Descriptive names** - Make test intent clear
4. **Group related tests** - Use describe blocks

### Mock Management

1. **Reset mocks** - Clear mocks between tests
2. **Mock at the right level** - Component vs integration
3. **Verify mock calls** - Ensure correct API usage
4. **Use factories** - Consistent test data

### Performance

1. **Use Happy-DOM** - Faster than JSDOM
2. **Stub heavy components** - Reduce test complexity
3. **Mock external calls** - Avoid network requests
4. **Parallel execution** - Run tests concurrently

### Accessibility

1. **Test with screen readers in mind**
2. **Use semantic queries** - byRole, byLabelText
3. **Verify ARIA attributes**
4. **Test keyboard navigation**

## Debugging Tests

### Vitest UI

Use the interactive test UI:
```bash
pnpm test:ui
```

### Console Debugging

Add debug output:
```typescript
import { debug } from '@testing-library/vue'

debug(wrapper.html()) // Prints current DOM state
```

### VS Code Integration

Install the Vitest extension for:
- Inline test results
- Debugging capabilities
- Test exploration

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

Quality gates ensure:
- All tests pass
- Coverage thresholds met
- No linting errors
- Type checking passes

## Common Patterns

### Testing Forms

```typescript
it('submits form with valid data', async () => {
  const wrapper = mountComponent(FormComponent)
  
  await wrapper.find('input[name="email"]').setValue('test@example.com')
  await wrapper.find('form').trigger('submit')
  
  expect(mockApiCall).toHaveBeenCalledWith({
    email: 'test@example.com'
  })
})
```

### Testing Loading States

```typescript
it('shows loading spinner during fetch', () => {
  mockUseFetch.mockReturnValue({
    pending: ref(true),
    data: ref(null)
  })
  
  const wrapper = mountComponent(Component)
  expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
})
```

### Testing Error States

```typescript
it('displays error message on failure', () => {
  mockUseFetch.mockReturnValue({
    error: ref(new Error('Failed to load'))
  })
  
  const wrapper = mountComponent(Component)
  expect(wrapper.text()).toContain('Failed to load')
})
```

### Testing Navigation

```typescript
it('navigates to customer detail page', async () => {
  const wrapper = mountComponent(CustomerList)
  
  await wrapper.find('[data-testid="customer-link"]').trigger('click')
  
  expect(mockNavigateTo).toHaveBeenCalledWith('/customers/123')
})
```

## Troubleshooting

### Common Issues

1. **Import errors** - Check path aliases in vitest.config.ts
2. **Mock not working** - Ensure mock is imported before component
3. **Async test failures** - Use proper await/flushPromises
4. **Component not found** - Verify component registration

### Getting Help

1. Check existing test examples
2. Review Vitest documentation
3. Consult Vue Test Utils guide
4. Ask team for guidance

Remember: Good tests are investments in code quality and developer confidence!