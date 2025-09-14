# TDD Implementation Plan for Nuxt 3 Command Center

## Overview
This document provides a comprehensive, file-by-file implementation plan for the tdd-code-engineer agent to create unit tests for all testable components following strict TDD methodology.

## Testing Priority Order
1. **Pure Functions & Utils** (simplest, no dependencies)
2. **Composables** (may have some dependencies)  
3. **API Services** (TanStack Query integration)
4. **DTOs & Type Guards** (Zod schemas)
5. **Server Repositories** (Prisma mocks)
6. **Server Routers** (tRPC handlers)
7. **Vue Components** (most complex, many dependencies)

## Implementation Instructions

### PHASE 1: Pure Functions & Utilities
**Priority: HIGHEST - Start Here**

#### 1. `/app/utils/index.ts`
**Test File:** `/app/utils/index.test.ts`

**Test Plan:**
```typescript
describe('utils/index', () => {
  describe('randomInt', () => {
    // Happy path
    it('generates integer within range')
    it('includes min and max values in possible outputs')
    
    // Edge cases
    it('handles min === max')
    it('handles negative numbers')
    it('handles zero range')
    
    // Type tests
    it('returns number type')
  })
  
  describe('randomFrom', () => {
    // Happy path
    it('returns element from array')
    it('can return any element from array')
    
    // Edge cases
    it('handles single element array')
    it('throws or handles empty array gracefully')
    
    // Type tests
    it('preserves type of array elements')
  })
})
```

**Mock Strategy:** None needed - pure functions

**TDD Instructions:**
1. Write failing tests first
2. Test boundary conditions
3. Verify randomness distribution (statistical test)
4. Use `expectTypeOf` for type assertions

#### 2. `/utils/prisma-mappers.ts`
**Test File:** `/utils/prisma-mappers.test.ts`

**Test Plan:**
```typescript
describe('prisma-mappers', () => {
  describe('transformDates', () => {
    // Happy path
    it('converts Date objects to ISO strings')
    it('recursively transforms nested objects')
    it('handles arrays of objects')
    
    // Edge cases
    it('handles null values')
    it('handles undefined values')
    it('handles empty objects')
    it('handles circular references safely')
    it('preserves non-Date properties')
    
    // Type preservation
    it('maintains object structure')
  })
  
  describe('nullToUndefined', () => {
    // Happy path
    it('converts null to undefined')
    it('recursively transforms nested objects')
    it('handles arrays')
    
    // Edge cases
    it('preserves undefined values')
    it('preserves other falsy values (0, false, "")')
    it('handles mixed nested structures')
  })
  
  describe('prismaToDTO', () => {
    // Composition test
    it('applies both transformations in correct order')
    it('handles complex nested structures')
  })
})
```

**Mock Strategy:** None needed - pure functions

**TDD Instructions:**
1. Create diverse test fixtures (flat, nested, arrays)
2. Test each transformer in isolation first
3. Test composition behavior
4. Verify immutability (original object unchanged)

#### 3. `/utils/selector-builder.ts`
**Test File:** `/utils/selector-builder.test.ts`

**Test Plan:**
```typescript
describe('selector-builder', () => {
  describe('useSelectorFromZod', () => {
    // Happy path
    it('builds correct selector from simple schema')
    it('handles nested object schemas')
    it('handles array schemas')
    it('handles optional fields')
    it('handles nullable fields')
    
    // Options testing
    it('excludes specified fields')
    it('includes custom relations')
    it('respects maxDepth to prevent infinite recursion')
    
    // Edge cases
    it('handles empty schemas')
    it('handles circular schema references')
    it('handles union types')
    it('handles intersection types')
    
    // Fluent API
    it('withRelation adds relation config')
    it('whereRelation adds where clause')
    it('chainable methods work correctly')
  })
  
  describe('useSmartSelector', () => {
    // Happy path
    it('auto-detects relations from schema')
    it('applies relation filters')
    it('skips specified relations')
    it('applies field overrides')
    
    // Complex scenarios
    it('handles deeply nested schemas')
    it('handles mixed relation types')
    it('prevents circular reference issues')
  })
})
```

**Mock Strategy:** Create test Zod schemas of varying complexity

**TDD Instructions:**
1. Start with simple Zod schemas, progressively add complexity
2. Test schema analysis logic separately
3. Verify selector output structure matches Prisma expectations
4. Use snapshot testing for complex selector outputs

### PHASE 2: Composables

#### 4. `/app/composables/useDashboard.ts`
**Test File:** `/app/composables/useDashboard.test.ts`

**Test Plan:**
```typescript
describe('useDashboard', () => {
  // State management
  it('initializes with notifications closed')
  it('toggles notifications slideover')
  
  // Keyboard shortcuts
  it('registers keyboard shortcuts')
  it('navigates to home on g-h')
  it('navigates to inbox on g-i')
  it('navigates to customers on g-c')
  it('navigates to settings on g-s')
  it('toggles notifications on n')
  
  // Route watching
  it('closes notifications on route change')
  it('preserves other state on route change')
  
  // Shared composable behavior
  it('shares state between multiple instances')
})
```

**Mock Strategy:**
- Mock `useRoute` and `useRouter`
- Mock `defineShortcuts` from VueUse
- Mock route watcher

**TDD Instructions:**
1. Setup router mocks in beforeEach
2. Test keyboard shortcut registration
3. Simulate route changes
4. Verify shared state behavior

#### 5. `/app/composables/useApiConfig.ts`
**Test File:** `/app/composables/useApiConfig.test.ts`

**Test Plan:**
```typescript
describe('useApiConfig', () => {
  describe('default configuration', () => {
    it('uses default values when no config provided')
    it('has correct default staleTime')
    it('has correct default gcTime')
  })
  
  describe('config merging', () => {
    it('overrides defaults with provided config')
    it('preserves unspecified defaults')
  })
  
  describe('getQueryOptions', () => {
    it('returns correct options for normal cache')
    it('returns zero times when bypassCache is true')
    it('includes refetchOnMount when specified')
    it('merges with base options')
  })
  
  describe('getMutationOptions', () => {
    it('passes through base options')
    it('applies mutation-specific config')
  })
})
```

**Mock Strategy:** None needed - pure composable logic

**TDD Instructions:**
1. Test default values first
2. Test each config option in isolation
3. Test combinations of options
4. Verify TypeScript types with expectTypeOf

### PHASE 3: API Services (TanStack Query)

#### 6. `/app/api/services/helpers/index.ts`
**Test File:** `/app/api/services/helpers/index.test.ts`

**Test Plan:**
```typescript
describe('api/services/helpers', () => {
  describe('defineService', () => {
    // Query generation
    it('creates query hooks with correct names')
    it('creates plain callable functions')
    it('passes args to queryFn')
    it('generates correct query keys')
    it('applies API config to queries')
    
    // Mutation generation
    it('creates mutation hooks with correct names')
    it('creates callable wrappers')
    it('invalidates cache on success')
    it('handles multiple cache keys')
    
    // Type safety
    it('preserves types for queries')
    it('preserves types for mutations')
    it('handles void arguments correctly')
  })
  
  describe('defineMutation', () => {
    it('creates mutation with cache invalidation')
    it('calls onSuccess callback')
    it('handles array and string cache keys')
  })
})
```

**Mock Strategy:**
- Mock `useQueryClient`
- Mock `useQuery` and `useMutation`
- Create test service definitions

**TDD Instructions:**
1. Test service definition structure
2. Verify hook generation naming
3. Test cache invalidation logic
4. Verify type inference with expectTypeOf

#### 7. `/app/api/services/plans.ts`
**Test File:** `/app/api/services/plans.test.ts`

**Test Plan:**
```typescript
describe('planService', () => {
  describe('queries', () => {
    it('getAll generates correct query key')
    it('getAll passes pagination to tRPC')
    it('query key includes pagination params')
  })
  
  describe('mutations', () => {
    it('create calls tRPC store mutation')
    it('create invalidates getAll cache')
    it('handles creation errors')
  })
  
  describe('service interface', () => {
    it('exposes correct methods')
    it('methods return TanStack Query hooks')
  })
})
```

**Mock Strategy:**
- Mock `useNuxtApp().$trpc`
- Mock query/mutation responses

**TDD Instructions:**
1. Mock tRPC client first
2. Test query key generation
3. Test cache invalidation patterns
4. Verify error handling

#### 8-12. Other API Services
Apply same pattern for:
- `/app/api/services/customers.ts`
- `/app/api/services/projects.ts`
- `/app/api/services/users.ts`
- `/app/api/services/business.ts`
- `/app/api/services/questions.ts`

Each should test:
- Query key generation
- tRPC method calls
- Cache invalidation
- Error handling
- Type safety

### PHASE 4: DTOs and Schemas

#### 13. `/dto/common.ts`
**Test File:** `/dto/common.test.ts`

**Test Plan:**
```typescript
describe('common DTOs', () => {
  describe('pagination schemas', () => {
    it('validates valid pagination')
    it('rejects negative page numbers')
    it('rejects invalid page sizes')
    it('has correct default values')
  })
  
  describe('type inference', () => {
    it('infers correct DTO types from schemas')
    it('handles optional fields')
  })
})
```

**TDD Instructions:**
1. Test schema validation with valid/invalid inputs
2. Use `expectTypeOf` to verify inferred types
3. Test edge cases (nulls, undefined, empty)

#### 14-19. Other DTO Files
Apply same pattern for all DTO files:
- Test schema validation
- Test type inference
- Test transformation logic
- Test edge cases

### PHASE 5: Server Repositories

#### 20. `/server/repositories/plans.ts`
**Test File:** `/server/repositories/plans.test.ts`

**Test Plan:**
```typescript
describe('plansRepository', () => {
  describe('findAll', () => {
    it('returns paginated results')
    it('applies correct select fields')
    it('handles empty results')
    it('transforms dates correctly')
  })
  
  describe('create', () => {
    it('creates new plan')
    it('returns created plan with ID')
    it('handles validation errors')
  })
  
  // Similar for update, delete, findById
})
```

**Mock Strategy:**
- Mock Prisma client
- Mock database responses
- Test data transformations

**TDD Instructions:**
1. Mock Prisma client methods
2. Test query building
3. Test error handling
4. Verify DTO transformations

### PHASE 6: Server Routers (tRPC)

#### 21. `/server/api/trpc/routers/plans.ts`
**Test File:** `/server/api/trpc/routers/plans.test.ts`

**Test Plan:**
```typescript
describe('plans router', () => {
  describe('getAll procedure', () => {
    it('validates input with Zod')
    it('calls repository method')
    it('returns paginated response')
    it('handles repository errors')
  })
  
  describe('store procedure', () => {
    it('validates input schema')
    it('calls repository create')
    it('returns created plan')
    it('maps domain errors to tRPC errors')
  })
})
```

**Mock Strategy:**
- Mock repository layer
- Mock tRPC context
- Test input/output validation

**TDD Instructions:**
1. Test input validation first
2. Mock repository responses
3. Test error mapping
4. Verify output schema parsing

### PHASE 7: Vue Components (Most Complex)

#### 22. Component Testing Pattern
**Example: `/app/components/customers/Table.vue`**
**Test File:** `/app/components/customers/Table.pending-test.ts`

**Test Plan:**
```typescript
describe('CustomersTable', () => {
  describe('rendering', () => {
    it('renders loading state')
    it('renders data rows')
    it('renders empty state')
    it('renders error state')
  })
  
  describe('interactions', () => {
    it('emits row click event')
    it('handles sorting')
    it('handles pagination')
    it('handles row selection')
  })
  
  describe('props validation', () => {
    it('validates required props')
    it('uses prop defaults')
  })
  
  describe('TanStack Query integration', () => {
    it('fetches data on mount')
    it('refetches on pagination change')
    it('handles loading states')
  })
})
```

**Mock Strategy:**
- Mock `useApi` composable
- Mock TanStack Query hooks
- Mock child components

**TDD Instructions:**
1. Test props/emits contract first
2. Test rendering states
3. Test user interactions
4. Test integration with queries

## Execution Order for tdd-code-engineer

### Day 1: Foundation (Pure Functions)
1. `/app/utils/index.test.ts`
2. `/utils/prisma-mappers.test.ts`
3. `/utils/selector-builder.test.ts`

### Day 2: Composables
4. `/app/composables/useDashboard.test.ts`
5. `/app/composables/useApiConfig.test.ts`

### Day 3: API Services Core
6. `/app/api/services/helpers/index.test.ts`
7. `/app/api/services/plans.test.ts`
8. `/app/api/services/customers.test.ts`

### Day 4: API Services Continued
9. `/app/api/services/projects.test.ts`
10. `/app/api/services/users.test.ts`
11. `/app/api/services/business.test.ts`
12. `/app/api/services/questions.test.ts`

### Day 5: DTOs
13-19. All DTO test files

### Day 6: Repositories
20-25. All repository test files

### Day 7: Routers
26-31. All router test files

### Day 8-10: Components
32+. Component test files (prioritize by complexity)

## Testing Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test app/utils/index.test.ts

# Run in watch mode
npm run test:watch

# Type checking
npm run typecheck
```

## Mock Patterns Reference

### Mock useApi
```typescript
vi.mock('~/api', () => ({
  useApi: vi.fn(() => ({
    plans: {
      getAll: vi.fn(),
      create: vi.fn()
    }
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
    isLoading: ref(false)
  }))
}))
```

### Mock Prisma Client
```typescript
const mockPrisma = {
  plan: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}
```

## Success Criteria

Each test file must:
1. Have >80% coverage for its target file
2. Test all happy paths
3. Test all edge cases
4. Test error handling
5. Include type safety tests with `expectTypeOf`
6. Follow TDD: Red → Green → Refactor
7. Run successfully with `npm run test`
8. Pass typecheck with `npm run typecheck`

## Notes for tdd-code-engineer

1. **Always write tests first** - they must fail initially
2. **Test behavior, not implementation** - focus on inputs/outputs
3. **Use descriptive test names** - should read like documentation
4. **Group related tests** - use nested describe blocks
5. **One assertion per test** - when possible
6. **Mock at boundaries** - mock external dependencies only
7. **Test types** - use expectTypeOf for type assertions
8. **Handle async properly** - use async/await for promises
9. **Clean up** - use beforeEach/afterEach for setup/teardown
10. **Document why** - add comments for complex test logic

## Coverage Goals

- Utils: 100%
- Composables: 90%
- API Services: 85%
- DTOs: 95%
- Repositories: 80%
- Routers: 80%
- Components: 75%

Overall target: >80% coverage

## Test File Naming Convention

- Unit tests: `[filename].test.ts`
- Integration tests: `[filename].integration.test.ts`
- E2E tests: `[filename].e2e.test.ts`

## Test Structure Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { expectTypeOf } from 'vitest'

describe('[Component/Function Name]', () => {
  beforeEach(() => {
    // Setup
  })
  
  describe('[Feature/Method]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

This plan provides comprehensive, actionable instructions for implementing tests across the entire codebase following TDD methodology.
