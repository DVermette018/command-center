import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { randomInt, randomFrom } from './index'

describe('app/utils/index', () => {
  describe('randomInt', () => {
    let mockMath: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      mockMath = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      mockMath.mockRestore()
    })

    describe('Red Phase: Define expected behavior', () => {
      it('should return min value when Math.random returns 0', () => {
        // Red: Write failing test first
        mockMath.mockReturnValue(0)
        
        const result = randomInt(5, 10)
        
        expect(result).toBe(5)
      })

      it('should return max value when Math.random returns close to 1', () => {
        // Red: Write failing test for max boundary
        mockMath.mockReturnValue(0.999999)
        
        const result = randomInt(5, 10)
        
        expect(result).toBe(10)
      })

      it('should return integer within range for mid-range random values', () => {
        // Red: Test mid-range behavior
        mockMath.mockReturnValue(0.5)
        
        const result = randomInt(1, 10)
        
        expect(result).toBe(6) // 0.5 * (10-1+1) + 1 = 5 + 1 = 6
        expect(Number.isInteger(result)).toBe(true)
      })

      it('should handle single value range (min equals max)', () => {
        // Red: Edge case - single value
        mockMath.mockReturnValue(0.7) // Any random value should return the same
        
        const result = randomInt(5, 5)
        
        expect(result).toBe(5)
      })

      it('should work with negative numbers', () => {
        // Red: Test negative range
        mockMath.mockReturnValue(0)
        
        const result = randomInt(-10, -5)
        
        expect(result).toBe(-10)
      })

      it('should work with zero in range', () => {
        // Red: Test range including zero
        mockMath.mockReturnValue(0.5)
        
        const result = randomInt(-2, 2)
        
        expect(result).toBe(0) // 0.5 * (2-(-2)+1) + (-2) = 2.5 + (-2) = 0.5, floored = 0
      })

      it('should handle large number ranges', () => {
        // Red: Test large ranges
        mockMath.mockReturnValue(0.5)
        
        const result = randomInt(1000, 2000)
        
        expect(result).toBe(1500)
        expect(result).toBeGreaterThanOrEqual(1000)
        expect(result).toBeLessThanOrEqual(2000)
      })
    })

    describe('Green Phase: Verify implementation works', () => {
      it('should always return integers', () => {
        // Green: Verify return type is always integer
        for (let i = 0; i < 100; i++) {
          mockMath.mockReturnValue(Math.random())
          const result = randomInt(1, 100)
          expect(Number.isInteger(result)).toBe(true)
        }
      })

      it('should respect mathematical boundaries', () => {
        // Green: Comprehensive boundary testing
        const testCases = [
          { random: 0, min: 1, max: 5, expected: 1 },
          { random: 0.2, min: 1, max: 5, expected: 2 },
          { random: 0.4, min: 1, max: 5, expected: 3 },
          { random: 0.6, min: 1, max: 5, expected: 4 },
          { random: 0.8, min: 1, max: 5, expected: 5 },
          { random: 0.999999, min: 1, max: 5, expected: 5 }
        ]

        testCases.forEach(({ random, min, max, expected }) => {
          mockMath.mockReturnValue(random)
          const result = randomInt(min, max)
          expect(result).toBe(expected)
        })
      })
    })

    describe('Refactor Phase: Edge cases and type safety', () => {
      it('should handle decimal inputs by using them directly in calculations', () => {
        // Refactor: Test actual behavior with decimal inputs
        mockMath.mockReturnValue(0.5)
        
        // Math.floor(0.5 * (5.9 - 1.7 + 1)) + 1.7 = Math.floor(0.5 * 5.2) + 1.7 = Math.floor(2.6) + 1.7 = 2 + 1.7 = 3.7
        const result = randomInt(1.7, 5.9)
        
        expect(result).toBe(3.7)
      })

      it('should maintain consistent behavior across multiple calls', () => {
        // Refactor: Test consistency
        const results: number[] = []
        
        for (let i = 0; i < 10; i++) {
          mockMath.mockReturnValue(0.5)
          results.push(randomInt(10, 20))
        }
        
        // All results should be the same when Math.random is consistent
        expect(results.every(r => r === 15)).toBe(true)
      })

      it('should throw or handle invalid ranges gracefully', () => {
        // Refactor: Test invalid input handling
        mockMath.mockReturnValue(0.5)
        
        // When min > max, the current implementation will still work
        // but return values in the "swapped" range
        const result = randomInt(10, 5)
        
        // Current implementation: Math.floor(0.5 * (5-10+1)) + 10 = Math.floor(-2) + 10 = -2 + 10 = 8
        expect(result).toBe(8)
      })
    })
  })

  describe('randomFrom', () => {
    let mockMath: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      mockMath = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      mockMath.mockRestore()
    })

    describe('Red Phase: Define expected behavior', () => {
      it('should return first element when Math.random returns 0', () => {
        // Red: Test first element selection
        mockMath.mockReturnValue(0)
        const array = ['a', 'b', 'c']
        
        const result = randomFrom(array)
        
        expect(result).toBe('a')
      })

      it('should return last element when Math.random returns close to 1', () => {
        // Red: Test last element selection
        mockMath.mockReturnValue(0.999999)
        const array = ['a', 'b', 'c']
        
        const result = randomFrom(array)
        
        expect(result).toBe('c')
      })

      it('should return middle element for mid-range random values', () => {
        // Red: Test middle element selection
        mockMath.mockReturnValue(0.5)
        const array = ['x', 'y', 'z']
        
        const result = randomFrom(array)
        
        expect(result).toBe('y') // 0.5 * 3 = 1.5, floored = 1, array[1] = 'y'
      })

      it('should work with single element arrays', () => {
        // Red: Edge case - single element
        mockMath.mockReturnValue(0.7) // Any value should return the only element
        const array = ['only']
        
        const result = randomFrom(array)
        
        expect(result).toBe('only')
      })

      it('should work with different data types', () => {
        // Red: Test type flexibility
        mockMath.mockReturnValue(0)
        
        const numberArray = [1, 2, 3]
        const objectArray = [{ id: 1 }, { id: 2 }]
        const booleanArray = [true, false]
        
        expect(randomFrom(numberArray)).toBe(1)
        expect(randomFrom(objectArray)).toEqual({ id: 1 })
        expect(randomFrom(booleanArray)).toBe(true)
      })
    })

    describe('Green Phase: Verify implementation works', () => {
      it('should maintain type safety with generic types', () => {
        // Green: Verify TypeScript generics work correctly
        mockMath.mockReturnValue(0.5)
        
        const stringArray: string[] = ['hello', 'world', 'test']
        const numberArray: number[] = [1, 2, 3]
        
        const stringResult = randomFrom(stringArray)
        const numberResult = randomFrom(numberArray)
        
        // TypeScript should infer correct types
        expect(typeof stringResult).toBe('string')
        expect(typeof numberResult).toBe('number')
        expect(stringResult).toBe('world')
        expect(numberResult).toBe(2)
      })

      it('should select all elements with appropriate random values', () => {
        // Green: Test complete range coverage
        const array = ['first', 'second', 'third', 'fourth']
        const testCases = [
          { random: 0, expected: 'first' },
          { random: 0.24, expected: 'first' },
          { random: 0.25, expected: 'second' },
          { random: 0.49, expected: 'second' },
          { random: 0.5, expected: 'third' },
          { random: 0.74, expected: 'third' },
          { random: 0.75, expected: 'fourth' },
          { random: 0.999999, expected: 'fourth' }
        ]

        testCases.forEach(({ random, expected }) => {
          mockMath.mockReturnValue(random)
          const result = randomFrom(array)
          expect(result).toBe(expected)
        })
      })
    })

    describe('Refactor Phase: Edge cases and robustness', () => {
      it('should handle empty arrays gracefully', () => {
        // Refactor: Test edge case behavior
        mockMath.mockReturnValue(0.5)
        const emptyArray: string[] = []
        
        const result = randomFrom(emptyArray)
        
        // Current implementation will return undefined due to array[NaN]
        expect(result).toBeUndefined()
      })

      it('should work with complex nested objects', () => {
        // Refactor: Test complex data structures
        mockMath.mockReturnValue(0)
        const complexArray = [
          { user: { name: 'John', roles: ['admin'] } },
          { user: { name: 'Jane', roles: ['user', 'moderator'] } }
        ]
        
        const result = randomFrom(complexArray)
        
        expect(result).toEqual({ user: { name: 'John', roles: ['admin'] } })
      })

      it('should maintain referential integrity', () => {
        // Refactor: Verify object references are preserved
        mockMath.mockReturnValue(0)
        const originalObject = { id: 1, data: 'test' }
        const array = [originalObject, { id: 2, data: 'other' }]
        
        const result = randomFrom(array)
        
        expect(result).toBe(originalObject) // Same reference, not just equal
      })

      it('should work consistently with frozen arrays', () => {
        // Refactor: Test with immutable arrays
        mockMath.mockReturnValue(0.5)
        const frozenArray = Object.freeze(['a', 'b', 'c'])
        
        const result = randomFrom(frozenArray)
        
        expect(result).toBe('b')
      })
    })

    describe('Type Safety Tests', () => {
      it('should preserve array element types correctly', () => {
        // Additional type safety verification
        interface TestInterface {
          id: number
          name: string
        }
        
        mockMath.mockReturnValue(0)
        const typedArray: TestInterface[] = [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' }
        ]
        
        const result = randomFrom(typedArray)
        
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(typeof result.id).toBe('number')
        expect(typeof result.name).toBe('string')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should work together in realistic scenarios', () => {
      // Integration test using both functions
      const availableOptions = ['option1', 'option2', 'option3', 'option4', 'option5']
      const randomCount = randomInt(1, availableOptions.length)
      
      const selectedOptions: string[] = []
      for (let i = 0; i < randomCount; i++) {
        selectedOptions.push(randomFrom(availableOptions))
      }
      
      expect(selectedOptions).toHaveLength(randomCount)
      expect(selectedOptions.every(option => availableOptions.includes(option))).toBe(true)
    })
  })
})