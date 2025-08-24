# TDD Execution Guide for tdd-code-engineer

## Current Status
- ✅ Vitest configured and working
- ✅ Test setup complete with mocks
- ✅ 18 todos identified in testing plan
- ⏳ 0 test files created
- ⏳ 0% coverage

## Immediate Action Items

### STEP 1: Create First Test File (Pure Functions)
**File to test:** `/app/utils/index.ts`
**Test file to create:** `/app/utils/index.test.ts`

```bash
# Verify current state
cat /app/utils/index.ts

# Create test file with initial failing tests
```

**Complete Test Implementation:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { expectTypeOf } from 'vitest'
import { randomInt, randomFrom } from './index'

describe('utils/index', () => {
  describe('randomInt', () => {
    it('should generate integer within range', () => {
      const result = randomInt(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
      expect(Number.isInteger(result)).toBe(true)
    })
    
    it('should include min and max values in possible outputs', () => {
      const results = new Set()
      for (let i = 0; i < 1000; i++) {
        results.add(randomInt(1, 3))
      }
      expect(results.has(1)).toBe(true)
      expect(results.has(3)).toBe(true)
    })
    
    it('should handle min === max', () => {
      const result = randomInt(5, 5)
      expect(result).toBe(5)
    })
    
    it('should handle negative numbers', () => {
      const result = randomInt(-10, -5)
      expect(result).toBeGreaterThanOrEqual(-10)
      expect(result).toBeLessThanOrEqual(-5)
    })
    
    it('should return number type', () => {
      const result = randomInt(1, 10)
      expectTypeOf(result).toBeNumber()
    })
  })
  
  describe('randomFrom', () => {
    it('should return element from array', () => {
      const array = ['a', 'b', 'c']
      const result = randomFrom(array)
      expect(array).toContain(result)
    })
    
    it('should be able to return any element from array', () => {
      const array = ['x', 'y', 'z']
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        results.add(randomFrom(array))
      }
      expect(results.size).toBe(3)
    })
    
    it('should handle single element array', () => {
      const result = randomFrom(['only'])
      expect(result).toBe('only')
    })
    
    it('should preserve type of array elements', () => {
      const numbers = [1, 2, 3]
      const result = randomFrom(numbers)
      expectTypeOf(result).toBeNumber()
      
      const strings = ['a', 'b', 'c']
      const strResult = randomFrom(strings)
      expectTypeOf(strResult).toBeString()
    })
  })
})
```

**Run this test:**
```bash
npm run test app/utils/index.test.ts
```

### STEP 2: Create Prisma Mappers Tests
**File to test:** `/utils/prisma-mappers.ts`
**Test file to create:** `/utils/prisma-mappers.test.ts`

**Complete Test Implementation:**
```typescript
import { describe, it, expect } from 'vitest'
import { expectTypeOf } from 'vitest'
import { transformDates, nullToUndefined, prismaToDTO } from './prisma-mappers'

describe('prisma-mappers', () => {
  describe('transformDates', () => {
    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const input = { createdAt: date }
      const result = transformDates(input)
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })
    
    it('should recursively transform nested objects', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const input = {
        user: {
          createdAt: date,
          profile: {
            updatedAt: date
          }
        }
      }
      const result = transformDates(input)
      expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.user.profile.updatedAt).toBe('2024-01-01T00:00:00.000Z')
    })
    
    it('should handle arrays of objects', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const input = {
        items: [
          { createdAt: date },
          { createdAt: date }
        ]
      }
      const result = transformDates(input)
      expect(result.items[0].createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.items[1].createdAt).toBe('2024-01-01T00:00:00.000Z')
    })
    
    it('should preserve non-Date properties', () => {
      const input = {
        id: 1,
        name: 'test',
        active: true,
        count: 0,
        data: null
      }
      const result = transformDates(input)
      expect(result).toEqual(input)
    })
    
    it('should handle empty objects', () => {
      const result = transformDates({})
      expect(result).toEqual({})
    })
    
    it('should maintain object structure', () => {
      const input = {
        a: { b: { c: 'value' } }
      }
      const result = transformDates(input)
      expectTypeOf(result).toMatchTypeOf(input)
    })
  })
  
  describe('nullToUndefined', () => {
    it('should convert null to undefined', () => {
      const input = { value: null }
      const result = nullToUndefined(input)
      expect(result.value).toBeUndefined()
    })
    
    it('should recursively transform nested objects', () => {
      const input = {
        user: {
          name: null,
          profile: {
            bio: null
          }
        }
      }
      const result = nullToUndefined(input)
      expect(result.user.name).toBeUndefined()
      expect(result.user.profile.bio).toBeUndefined()
    })
    
    it('should handle arrays', () => {
      const input = {
        items: [
          { value: null },
          { value: 'test' }
        ]
      }
      const result = nullToUndefined(input)
      expect(result.items[0].value).toBeUndefined()
      expect(result.items[1].value).toBe('test')
    })
    
    it('should preserve other falsy values', () => {
      const input = {
        zero: 0,
        empty: '',
        false: false,
        undefined: undefined
      }
      const result = nullToUndefined(input)
      expect(result.zero).toBe(0)
      expect(result.empty).toBe('')
      expect(result.false).toBe(false)
      expect(result.undefined).toBeUndefined()
    })
  })
  
  describe('prismaToDTO', () => {
    it('should apply both transformations', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const input = {
        id: 1,
        createdAt: date,
        name: null,
        description: 'test'
      }
      const result = prismaToDTO(input)
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.name).toBeUndefined()
      expect(result.description).toBe('test')
    })
    
    it('should handle complex nested structures', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const input = {
        user: {
          createdAt: date,
          email: null,
          posts: [
            { publishedAt: date, draft: null },
            { publishedAt: null, draft: false }
          ]
        }
      }
      const result = prismaToDTO(input)
      expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.user.email).toBeUndefined()
      expect(result.user.posts[0].publishedAt).toBe('2024-01-01T00:00:00.000Z')
      expect(result.user.posts[0].draft).toBeUndefined()
      expect(result.user.posts[1].publishedAt).toBeUndefined()
      expect(result.user.posts[1].draft).toBe(false)
    })
  })
})
```

### STEP 3: Create Selector Builder Tests
**File to test:** `/utils/selector-builder.ts`
**Test file to create:** `/utils/selector-builder.test.ts`

**Complete Test Implementation:**
```typescript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { useSelectorFromZod, useSmartSelector } from './selector-builder'

describe('selector-builder', () => {
  describe('useSelectorFromZod', () => {
    it('should build selector from simple schema', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
        age: z.number()
      })
      
      const { selector } = useSelectorFromZod(schema)
      expect(selector).toEqual({
        id: true,
        name: true,
        age: true
      })
    })
    
    it('should handle nested object schemas', () => {
      const schema = z.object({
        id: z.string(),
        profile: z.object({
          bio: z.string(),
          avatar: z.string()
        })
      })
      
      const { selector } = useSelectorFromZod(schema)
      expect(selector).toEqual({
        id: true,
        profile: {
          select: {
            bio: true,
            avatar: true
          }
        }
      })
    })
    
    it('should handle array schemas', () => {
      const schema = z.object({
        posts: z.array(z.object({
          title: z.string(),
          content: z.string()
        }))
      })
      
      const { selector } = useSelectorFromZod(schema)
      expect(selector).toEqual({
        posts: {
          select: {
            title: true,
            content: true
          }
        }
      })
    })
    
    it('should handle optional fields', () => {
      const schema = z.object({
        id: z.string(),
        bio: z.string().optional()
      })
      
      const { selector } = useSelectorFromZod(schema)
      expect(selector).toEqual({
        id: true,
        bio: true
      })
    })
    
    it('should exclude specified fields', () => {
      const schema = z.object({
        id: z.string(),
        password: z.string(),
        email: z.string()
      })
      
      const { selector } = useSelectorFromZod(schema, {
        exclude: ['password']
      })
      expect(selector).toEqual({
        id: true,
        email: true
      })
    })
    
    it('should respect maxDepth', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              level4: z.string()
            })
          })
        })
      })
      
      const { selector } = useSelectorFromZod(schema, { maxDepth: 2 })
      expect(selector.level1.select.level2).toBe(true)
    })
    
    it('should support fluent API withRelation', () => {
      const schema = z.object({
        id: z.string(),
        posts: z.array(z.object({ title: z.string() }))
      })
      
      const result = useSelectorFromZod(schema)
        .withRelation('posts', { take: 10, orderBy: { createdAt: 'desc' } })
      
      expect(result.selector.posts).toEqual({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    })
    
    it('should support whereRelation', () => {
      const schema = z.object({
        id: z.string(),
        posts: z.array(z.object({ title: z.string() }))
      })
      
      const result = useSelectorFromZod(schema)
        .whereRelation('posts', { published: true })
      
      expect(result.selector.posts.where).toEqual({ published: true })
    })
  })
  
  describe('useSmartSelector', () => {
    it('should auto-detect relations', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
        posts: z.array(z.object({
          title: z.string()
        })),
        profile: z.object({
          bio: z.string()
        })
      })
      
      const selector = useSmartSelector(schema)
      expect(selector.posts).toHaveProperty('select')
      expect(selector.profile).toHaveProperty('select')
      expect(selector.id).toBe(true)
      expect(selector.name).toBe(true)
    })
    
    it('should apply relation filters', () => {
      const schema = z.object({
        posts: z.array(z.object({ title: z.string() }))
      })
      
      const selector = useSmartSelector(schema, {
        relationFilters: {
          posts: { published: true }
        }
      })
      
      expect(selector.posts.where).toEqual({ published: true })
    })
    
    it('should skip specified relations', () => {
      const schema = z.object({
        id: z.string(),
        posts: z.array(z.object({ title: z.string() }))
      })
      
      const selector = useSmartSelector(schema, {
        skipRelations: ['posts']
      })
      
      expect(selector.posts).toBeUndefined()
      expect(selector.id).toBe(true)
    })
    
    it('should apply overrides', () => {
      const schema = z.object({
        id: z.string(),
        posts: z.array(z.object({ title: z.string() }))
      })
      
      const selector = useSmartSelector(schema, {
        overrides: {
          posts: { take: 5 }
        }
      })
      
      expect(selector.posts).toEqual({ take: 5 })
    })
  })
})
```

### STEP 4: Test Execution Commands

Run tests in this order:

```bash
# 1. Run first test (should pass)
npm run test app/utils/index.test.ts

# 2. Run second test (should pass)
npm run test utils/prisma-mappers.test.ts

# 3. Run third test (should pass)
npm run test utils/selector-builder.test.ts

# 4. Run all tests together
npm run test

# 5. Check coverage
npm run test:coverage

# 6. Type checking
npm run typecheck
```

### STEP 5: Continue with Composables

After pure functions are complete, proceed with:

1. `/app/composables/useDashboard.test.ts`
2. `/app/composables/useApiConfig.test.ts`

### Progress Tracking

Update this after each test file:

```markdown
## Test Coverage Progress

### Pure Functions (3 files)
- [ ] `/app/utils/index.test.ts`
- [ ] `/utils/prisma-mappers.test.ts`
- [ ] `/utils/selector-builder.test.ts`

### Composables (2 files)
- [ ] `/app/composables/useDashboard.test.ts`
- [ ] `/app/composables/useApiConfig.test.ts`

### API Services (7 files)
- [ ] `/app/api/services/helpers/index.test.ts`
- [ ] `/app/api/services/plans.test.ts`
- [ ] `/app/api/services/customers.test.ts`
- [ ] `/app/api/services/projects.test.ts`
- [ ] `/app/api/services/users.test.ts`
- [ ] `/app/api/services/business.test.ts`
- [ ] `/app/api/services/questions.test.ts`

### DTOs (7 files)
- [ ] `/dto/common.test.ts`
- [ ] `/dto/plan.test.ts`
- [ ] `/dto/customer.test.ts`
- [ ] `/dto/user.test.ts`
- [ ] `/dto/business.test.ts`
- [ ] `/dto/address.test.ts`
- [ ] `/dto/project.test.ts`
- [ ] `/dto/question.test.ts`

### Repositories (6 files)
- [ ] `/server/repositories/plans.test.ts`
- [ ] `/server/repositories/customers.test.ts`
- [ ] `/server/repositories/projects.test.ts`
- [ ] `/server/repositories/users.test.ts`
- [ ] `/server/repositories/business.test.ts`
- [ ] `/server/repositories/questions.test.ts`

### Routers (6 files)
- [ ] `/server/api/trpc/routers/plans.test.ts`
- [ ] `/server/api/trpc/routers/customers.test.ts`
- [ ] `/server/api/trpc/routers/projects.test.ts`
- [ ] `/server/api/trpc/routers/users.test.ts`
- [ ] `/server/api/trpc/routers/business.test.ts`
- [ ] `/server/api/trpc/routers/questions.test.ts`

### Components (Priority)
- [ ] `/app/components/customers/Table.test.ts`
- [ ] `/app/components/projects/Table.test.ts`
- [ ] `/app/components/customers/AddModal.test.ts`
- [ ] `/app/components/projects/AddModal.test.ts`
- [ ] (more to be added)

Total: 0/40+ files
Coverage: 0%
```

## Key TDD Rules for Each Test

1. **Write the test FIRST** - it must fail initially
2. **Write minimal code** to make test pass
3. **Refactor** with green tests
4. **One test at a time** - don't write multiple tests at once
5. **Commit after each green test**

## Error Handling Patterns

For each test file, include error cases:

```typescript
describe('error handling', () => {
  it('should handle null input gracefully', () => {
    // Test null handling
  })
  
  it('should handle undefined input', () => {
    // Test undefined handling
  })
  
  it('should handle empty input', () => {
    // Test empty arrays/objects
  })
  
  it('should handle malformed input', () => {
    // Test validation
  })
})
```

## Type Testing Pattern

Always include type tests:

```typescript
import { expectTypeOf } from 'vitest'

it('should have correct types', () => {
  const result = functionUnderTest()
  expectTypeOf(result).toMatchTypeOf<ExpectedType>()
})
```

## Async Testing Pattern

For async functions:

```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction()
  await expect(promise).resolves.toBe(expectedValue)
})

it('should handle async errors', async () => {
  const promise = asyncFunctionThatThrows()
  await expect(promise).rejects.toThrow('Expected error')
})
```

## Next Steps

1. Start with Step 1 immediately
2. Complete all pure function tests first (highest priority)
3. Move to composables (medium complexity)
4. Then API services (integration complexity)
5. Finally components (highest complexity)

Each test file should be fully complete before moving to the next.