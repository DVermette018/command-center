import { describe, expect, it } from 'vitest'
import { useApiConfig, type ApiConfig } from './useApiConfig'

describe('app/composables/useApiConfig', () => {
  describe('Red Phase: Define expected behavior', () => {
    it('should return default configuration when no config provided', () => {
      // Red: Test default behavior
      const result = useApiConfig()
      
      expect(result.config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10 // 10 minutes
      })
    })

    it('should merge provided config with defaults', () => {
      // Red: Test config merging
      const customConfig: ApiConfig = {
        bypassCache: true,
        staleTime: 30000
      }
      
      const result = useApiConfig(customConfig)
      
      expect(result.config).toEqual({
        bypassCache: true,
        refetchOnMount: false, // From default
        staleTime: 30000, // From custom
        gcTime: 1000 * 60 * 10 // From default
      })
    })

    it('should override all default values when provided', () => {
      // Red: Test complete override
      const customConfig: ApiConfig = {
        bypassCache: true,
        refetchOnMount: true,
        staleTime: 60000,
        gcTime: 120000
      }
      
      const result = useApiConfig(customConfig)
      
      expect(result.config).toEqual(customConfig)
    })

    it('should provide getQueryOptions function', () => {
      // Red: Test function presence
      const result = useApiConfig()
      
      expect(typeof result.getQueryOptions).toBe('function')
    })

    it('should provide getMutationOptions function', () => {
      // Red: Test function presence
      const result = useApiConfig()
      
      expect(typeof result.getMutationOptions).toBe('function')
    })
  })

  describe('Green Phase: Query options generation', () => {
    it('should generate query options with default config', () => {
      // Green: Test query options with defaults
      const result = useApiConfig()
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions).toEqual({
        queryKey: ['test'],
        queryFn: baseOptions.queryFn,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false
      })
    })

    it('should generate query options when bypassing cache', () => {
      // Green: Test cache bypass behavior
      const result = useApiConfig({ bypassCache: true })
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions).toEqual({
        queryKey: ['test'],
        queryFn: baseOptions.queryFn,
        staleTime: 0, // Cache bypassed
        gcTime: 0, // Cache bypassed
        refetchOnMount: true // Forced when bypassing cache
      })
    })

    it('should handle refetchOnMount configuration', () => {
      // Green: Test refetch behavior
      const result = useApiConfig({ refetchOnMount: true })
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions.refetchOnMount).toBe(true)
      expect(queryOptions.staleTime).toBe(1000 * 60 * 5) // Should use default staleTime
      expect(queryOptions.gcTime).toBe(1000 * 60 * 10) // Should use default gcTime
    })

    it('should preserve base options while adding config options', () => {
      // Green: Test option preservation
      const result = useApiConfig()
      const baseOptions = {
        queryKey: ['users', 'list'],
        queryFn: () => Promise.resolve(['user1', 'user2']),
        enabled: false,
        retry: 3,
        retryDelay: 1000
      }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions.queryKey).toEqual(['users', 'list'])
      expect(queryOptions.queryFn).toBe(baseOptions.queryFn)
      expect(queryOptions.enabled).toBe(false)
      expect(queryOptions.retry).toBe(3)
      expect(queryOptions.retryDelay).toBe(1000)
      expect(queryOptions.staleTime).toBe(1000 * 60 * 5)
      expect(queryOptions.gcTime).toBe(1000 * 60 * 10)
    })

    it('should generate mutation options by passing through base options', () => {
      // Green: Test mutation options
      const result = useApiConfig()
      const baseOptions = {
        mutationFn: (data: any) => Promise.resolve(data),
        onSuccess: () => {},
        onError: () => {},
        retry: 2
      }
      
      const mutationOptions = result.getMutationOptions(baseOptions)
      
      expect(mutationOptions).toEqual(baseOptions)
    })
  })

  describe('Refactor Phase: Edge cases and complex scenarios', () => {
    it('should handle undefined config gracefully', () => {
      // Refactor: Edge case handling
      const result = useApiConfig(undefined)
      
      expect(result.config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10
      })
    })

    it('should handle empty config object', () => {
      // Refactor: Empty config
      const result = useApiConfig({})
      
      expect(result.config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10
      })
    })

    it('should handle partial config with false values', () => {
      // Refactor: Falsy values should override defaults
      const result = useApiConfig({
        bypassCache: false,
        staleTime: 0
      })
      
      expect(result.config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 0, // Should be 0, not default
        gcTime: 1000 * 60 * 10
      })
    })

    it('should work with both bypassCache and refetchOnMount enabled', () => {
      // Refactor: Combined flags
      const result = useApiConfig({
        bypassCache: true,
        refetchOnMount: true
      })
      const baseOptions = { queryKey: ['test'], queryFn: () => Promise.resolve('data') }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions.staleTime).toBe(0) // Cache bypassed
      expect(queryOptions.gcTime).toBe(0) // Cache bypassed
      expect(queryOptions.refetchOnMount).toBe(true) // Both flags result in true
    })

    it('should handle custom timing configurations', () => {
      // Refactor: Custom timing
      const customConfig: ApiConfig = {
        staleTime: 1000, // 1 second
        gcTime: 5000 // 5 seconds
      }
      
      const result = useApiConfig(customConfig)
      const baseOptions = { queryKey: ['test'], queryFn: () => Promise.resolve('data') }
      
      const queryOptions = result.getQueryOptions(baseOptions)
      
      expect(queryOptions.staleTime).toBe(1000)
      expect(queryOptions.gcTime).toBe(5000)
      expect(queryOptions.refetchOnMount).toBe(false)
    })

    it('should maintain immutability of original config', () => {
      // Refactor: Test immutability
      const originalConfig: ApiConfig = {
        bypassCache: true,
        staleTime: 30000
      }
      
      const result = useApiConfig(originalConfig)
      
      // Modify the result config
      result.config.bypassCache = false
      
      // Original should remain unchanged
      expect(originalConfig.bypassCache).toBe(true)
    })

    it('should work with complex base options objects', () => {
      // Refactor: Complex real-world scenario
      const result = useApiConfig({
        bypassCache: false,
        staleTime: 30000,
        gcTime: 60000
      })
      
      const complexBaseOptions = {
        queryKey: ['users', { page: 1, limit: 10 }],
        queryFn: async ({ queryKey }) => {
          const [, params] = queryKey
          return fetch(`/api/users?page=${params.page}&limit=${params.limit}`)
        },
        enabled: true,
        retry: (failureCount: number, error: any) => failureCount < 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onSuccess: (data: any) => console.log('Success:', data),
        onError: (error: any) => console.error('Error:', error),
        select: (data: any) => data.users,
        placeholderData: [],
        keepPreviousData: true
      }
      
      const queryOptions = result.getQueryOptions(complexBaseOptions)
      
      // Should preserve all base options
      expect(queryOptions.queryKey).toEqual(['users', { page: 1, limit: 10 }])
      expect(queryOptions.queryFn).toBe(complexBaseOptions.queryFn)
      expect(queryOptions.enabled).toBe(true)
      expect(queryOptions.retry).toBe(complexBaseOptions.retry)
      expect(queryOptions.retryDelay).toBe(complexBaseOptions.retryDelay)
      expect(queryOptions.onSuccess).toBe(complexBaseOptions.onSuccess)
      expect(queryOptions.onError).toBe(complexBaseOptions.onError)
      expect(queryOptions.select).toBe(complexBaseOptions.select)
      expect(queryOptions.placeholderData).toEqual([])
      expect(queryOptions.keepPreviousData).toBe(true)
      
      // Should add config-based options
      expect(queryOptions.staleTime).toBe(30000)
      expect(queryOptions.gcTime).toBe(60000)
      expect(queryOptions.refetchOnMount).toBe(false)
    })
  })

  describe('Type Safety and Integration Tests', () => {
    it('should maintain type safety with generic query options', () => {
      // Type safety test
      interface User {
        id: number
        name: string
        email: string
      }
      
      const result = useApiConfig()
      const baseOptions = {
        queryKey: ['users'] as const,
        queryFn: (): Promise<User[]> => Promise.resolve([
          { id: 1, name: 'John', email: 'john@example.com' }
        ])
      }
      
      const queryOptions = result.getQueryOptions<User[]>(baseOptions)
      
      expect(typeof queryOptions.queryFn).toBe('function')
      expect(queryOptions.queryKey).toEqual(['users'])
    })

    it('should work with mutation options for different mutation types', () => {
      // Integration with mutation options
      const result = useApiConfig()
      
      const createUserMutation = {
        mutationFn: async (userData: { name: string; email: string }) => {
          return { id: 1, ...userData }
        },
        onSuccess: (data: any) => {
          console.log('User created:', data)
        },
        onError: (error: Error) => {
          console.error('Failed to create user:', error)
        }
      }
      
      const mutationOptions = result.getMutationOptions(createUserMutation)
      
      expect(mutationOptions).toEqual(createUserMutation)
      expect(typeof mutationOptions.mutationFn).toBe('function')
      expect(typeof mutationOptions.onSuccess).toBe('function')
      expect(typeof mutationOptions.onError).toBe('function')
    })

    it('should integrate well with real-world API configurations', () => {
      // Integration: Real-world usage pattern
      const apiConfig = useApiConfig({
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnMount: true
      })
      
      // Simulate different query scenarios
      const userListQuery = apiConfig.getQueryOptions({
        queryKey: ['users', 'list'],
        queryFn: () => fetch('/api/users').then(res => res.json())
      })
      
      const userDetailQuery = apiConfig.getQueryOptions({
        queryKey: ['users', 'detail', 1],
        queryFn: () => fetch('/api/users/1').then(res => res.json()),
        enabled: true
      })
      
      const createUserMutation = apiConfig.getMutationOptions({
        mutationFn: (userData: any) => fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData)
        }).then(res => res.json())
      })
      
      // Verify configuration is applied correctly
      expect(userListQuery.staleTime).toBe(120000) // 2 minutes
      expect(userListQuery.gcTime).toBe(300000) // 5 minutes
      expect(userListQuery.refetchOnMount).toBe(true)
      
      expect(userDetailQuery.staleTime).toBe(120000)
      expect(userDetailQuery.enabled).toBe(true)
      
      expect(createUserMutation.mutationFn).toBeDefined()
    })
  })

  describe('Performance and Memory Considerations', () => {
    it('should reuse the same config object for multiple calls', () => {
      // Performance: Config object reuse
      const customConfig = { staleTime: 30000 }
      const result1 = useApiConfig(customConfig)
      const result2 = useApiConfig(customConfig)
      
      // Should create new instances but have same config values
      expect(result1.config).toEqual(result2.config)
      expect(result1).not.toBe(result2) // Different instances
    })

    it('should handle repeated calls to getQueryOptions efficiently', () => {
      // Performance: Function call efficiency
      const result = useApiConfig()
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const options1 = result.getQueryOptions(baseOptions)
      const options2 = result.getQueryOptions(baseOptions)
      
      // Should generate consistent options
      expect(options1).toEqual(options2)
      // But should be different objects (not cached)
      expect(options1).not.toBe(options2)
    })
  })
})