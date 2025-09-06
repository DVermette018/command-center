import { describe, it, expect, beforeEach } from 'vitest'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query'
import { useApiConfig, type ApiConfig } from '../../app/composables/useApiConfig'

describe('useApiConfig', () => {
  beforeEach(() => {
    // Reset any global state if needed
  })

  describe('Default configuration', () => {
    it('returns default config when no options provided', () => {
      const { config } = useApiConfig()
      
      expect(config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10 // 10 minutes
      })
    })

    it('exposes all required functions', () => {
      const result = useApiConfig()
      
      expect(result).toHaveProperty('config')
      expect(result).toHaveProperty('getQueryOptions')
      expect(result).toHaveProperty('getMutationOptions')
      expect(typeof result.getQueryOptions).toBe('function')
      expect(typeof result.getMutationOptions).toBe('function')
    })
  })

  describe('Configuration merging', () => {
    it('merges provided config with defaults', () => {
      const customConfig: ApiConfig = {
        bypassCache: true,
        staleTime: 1000
      }
      
      const { config } = useApiConfig(customConfig)
      
      expect(config).toEqual({
        bypassCache: true,
        refetchOnMount: false, // default value
        staleTime: 1000, // custom value
        gcTime: 1000 * 60 * 10 // default value
      })
    })

    it('allows overriding all default values', () => {
      const customConfig: ApiConfig = {
        bypassCache: true,
        refetchOnMount: true,
        staleTime: 2000,
        gcTime: 3000
      }
      
      const { config } = useApiConfig(customConfig)
      
      expect(config).toEqual(customConfig)
    })

    it('handles partial config overrides', () => {
      const customConfig: ApiConfig = {
        refetchOnMount: true
      }
      
      const { config } = useApiConfig(customConfig)
      
      expect(config).toEqual({
        bypassCache: false, // default
        refetchOnMount: true, // custom
        staleTime: 1000 * 60 * 5, // default
        gcTime: 1000 * 60 * 10 // default
      })
    })

    it('handles empty config object', () => {
      const { config } = useApiConfig({})
      
      expect(config).toEqual({
        bypassCache: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10
      })
    })
  })

  describe('getQueryOptions', () => {
    it('returns query options with default config', () => {
      const { getQueryOptions } = useApiConfig()
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const options = getQueryOptions(baseOptions)
      
      expect(options).toEqual({
        ...baseOptions,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: false
      })
    })

    it('applies bypass cache configuration', () => {
      const { getQueryOptions } = useApiConfig({ bypassCache: true })
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const options = getQueryOptions(baseOptions)
      
      expect(options).toEqual({
        ...baseOptions,
        staleTime: 0, // bypassed
        gcTime: 0, // bypassed
        refetchOnMount: true // bypassed
      })
    })

    it('applies refetchOnMount when specified', () => {
      const { getQueryOptions } = useApiConfig({ 
        refetchOnMount: true,
        bypassCache: false
      })
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data')
      }
      
      const options = getQueryOptions(baseOptions)
      
      expect(options.refetchOnMount).toBe(true)
      expect(options.staleTime).toBe(1000 * 60 * 5) // not bypassed
      expect(options.gcTime).toBe(1000 * 60 * 10) // not bypassed
    })

    it('preserves base options properties', () => {
      const { getQueryOptions } = useApiConfig()
      const baseOptions = {
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
        enabled: true,
        retry: 3,
        retryDelay: 1000
      }
      
      const options = getQueryOptions(baseOptions)
      
      expect(options).toEqual(expect.objectContaining(baseOptions))
      expect(options.enabled).toBe(true)
      expect(options.retry).toBe(3)
      expect(options.retryDelay).toBe(1000)
    })

    it('handles complex base options', () => {
      const { getQueryOptions } = useApiConfig()
      const baseOptions = {
        queryKey: ['users', { page: 1, limit: 10 }],
        queryFn: ({ queryKey }: any) => Promise.resolve(queryKey),
        select: (data: any) => data.users,
        onSuccess: () => console.log('success'),
        onError: () => console.log('error')
      }
      
      const options = getQueryOptions(baseOptions)
      
      expect(options.queryKey).toEqual(baseOptions.queryKey)
      expect(options.queryFn).toBe(baseOptions.queryFn)
      expect(options.select).toBe(baseOptions.select)
      expect(options.onSuccess).toBe(baseOptions.onSuccess)
      expect(options.onError).toBe(baseOptions.onError)
    })
  })

  describe('getMutationOptions', () => {
    it('returns mutation options unchanged', () => {
      const { getMutationOptions } = useApiConfig()
      const baseOptions = {
        mutationFn: (data: any) => Promise.resolve(data),
        onSuccess: () => console.log('success')
      }
      
      const options = getMutationOptions(baseOptions)
      
      expect(options).toEqual(baseOptions)
    })

    it('preserves all mutation properties', () => {
      const { getMutationOptions } = useApiConfig()
      const baseOptions = {
        mutationFn: (data: any) => Promise.resolve(data),
        onSuccess: () => console.log('success'),
        onError: () => console.log('error'),
        onMutate: () => console.log('mutate'),
        retry: 2,
        retryDelay: 500
      }
      
      const options = getMutationOptions(baseOptions)
      
      expect(options).toEqual(baseOptions)
    })

    it('works with different config options', () => {
      const { getMutationOptions } = useApiConfig({ bypassCache: true })
      const baseOptions = {
        mutationFn: (data: any) => Promise.resolve(data)
      }
      
      const options = getMutationOptions(baseOptions)
      
      expect(options).toEqual(baseOptions)
    })

    it('handles empty base options', () => {
      const { getMutationOptions } = useApiConfig()
      const baseOptions = {}
      
      const options = getMutationOptions(baseOptions)
      
      expect(options).toEqual(baseOptions)
    })
  })

  describe('Edge cases and error handling', () => {
    it('handles null base options gracefully', () => {
      const { getQueryOptions, getMutationOptions } = useApiConfig()
      
      expect(() => getQueryOptions(null)).not.toThrow()
      expect(() => getMutationOptions(null)).not.toThrow()
      
      const queryOptions = getQueryOptions(null)
      const mutationOptions = getMutationOptions(null)
      
      expect(queryOptions).toHaveProperty('staleTime')
      expect(queryOptions).toHaveProperty('gcTime')
      expect(queryOptions).toHaveProperty('refetchOnMount')
      expect(mutationOptions).toEqual({})
    })

    it('handles undefined base options gracefully', () => {
      const { getQueryOptions, getMutationOptions } = useApiConfig()
      
      expect(() => getQueryOptions(undefined)).not.toThrow()
      expect(() => getMutationOptions(undefined)).not.toThrow()
    })

    it('handles extreme time values', () => {
      const extremeConfig: ApiConfig = {
        staleTime: Number.MAX_SAFE_INTEGER,
        gcTime: 0
      }
      
      const { getQueryOptions } = useApiConfig(extremeConfig)
      const options = getQueryOptions({})
      
      expect(options.staleTime).toBe(Number.MAX_SAFE_INTEGER)
      expect(options.gcTime).toBe(0)
    })

    it('handles negative time values', () => {
      const negativeConfig: ApiConfig = {
        staleTime: -1,
        gcTime: -1000
      }
      
      const { getQueryOptions } = useApiConfig(negativeConfig)
      const options = getQueryOptions({})
      
      expect(options.staleTime).toBe(-1)
      expect(options.gcTime).toBe(-1000)
    })
  })

  describe('Type safety and TypeScript integration', () => {
    it('maintains TypeScript types for UseQueryOptions', () => {
      const { getQueryOptions } = useApiConfig()
      
      // Test with typed generic
      const typedOptions: UseQueryOptions<string> = getQueryOptions<string>({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('string data')
      })
      
      expect(typedOptions).toBeDefined()
      expect(typeof typedOptions.queryFn).toBe('function')
    })

    it('maintains TypeScript types for UseMutationOptions', () => {
      const { getMutationOptions } = useApiConfig()
      
      // Test with typed generic
      const typedOptions: UseMutationOptions<string> = getMutationOptions<string>({
        mutationFn: () => Promise.resolve('string data')
      })
      
      expect(typedOptions).toBeDefined()
      expect(typeof typedOptions.mutationFn).toBe('function')
    })
  })

  describe('Performance and memory considerations', () => {
    it('creates new instances for each call', () => {
      const api1 = useApiConfig()
      const api2 = useApiConfig()
      
      // Should be different instances
      expect(api1).not.toBe(api2)
      expect(api1.config).not.toBe(api2.config)
    })

    it('creates new instances with same config values', () => {
      const config: ApiConfig = { staleTime: 1000 }
      const api1 = useApiConfig(config)
      const api2 = useApiConfig(config)
      
      expect(api1.config).toEqual(api2.config)
      expect(api1.config).not.toBe(api2.config) // Different objects
    })

    it('does not mutate original config object', () => {
      const originalConfig: ApiConfig = { staleTime: 1000 }
      const configCopy = { ...originalConfig }
      
      useApiConfig(originalConfig)
      
      expect(originalConfig).toEqual(configCopy)
    })
  })

  describe('Integration scenarios', () => {
    it('works with typical query scenario', () => {
      const { getQueryOptions } = useApiConfig({
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchOnMount: true
      })
      
      const options = getQueryOptions({
        queryKey: ['users'],
        queryFn: () => fetch('/api/users').then(res => res.json()),
        enabled: true
      })
      
      expect(options).toEqual({
        queryKey: ['users'],
        queryFn: expect.any(Function),
        enabled: true,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10, // default
        refetchOnMount: true
      })
    })

    it('works with cache bypassing scenario', () => {
      const { getQueryOptions } = useApiConfig({ bypassCache: true })
      
      const options = getQueryOptions({
        queryKey: ['fresh-data'],
        queryFn: () => fetch('/api/fresh-data').then(res => res.json())
      })
      
      expect(options.staleTime).toBe(0)
      expect(options.gcTime).toBe(0)
      expect(options.refetchOnMount).toBe(true)
    })

    it('works with mutation scenario', () => {
      const { getMutationOptions } = useApiConfig()
      
      const options = getMutationOptions({
        mutationFn: (userData: any) => fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData)
        }).then(res => res.json()),
        onSuccess: () => {
          // Invalidate queries
        }
      })
      
      expect(options.mutationFn).toBeDefined()
      expect(options.onSuccess).toBeDefined()
    })
  })
})