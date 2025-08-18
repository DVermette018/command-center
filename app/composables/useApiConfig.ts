import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query'

export interface ApiConfig {
  bypassCache?: boolean
  refetchOnMount?: boolean
  staleTime?: number
  gcTime?: number
}

const defaultConfig: ApiConfig = {
  bypassCache: false,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10 // 10 minutes
}

export const useApiConfig = (config?: ApiConfig) => {
  const mergedConfig = { ...defaultConfig, ...config }
  
  const getQueryOptions = <T>(baseOptions: any): UseQueryOptions<T> => ({
    ...baseOptions,
    staleTime: mergedConfig.bypassCache ? 0 : mergedConfig.staleTime,
    gcTime: mergedConfig.bypassCache ? 0 : mergedConfig.gcTime,
    refetchOnMount: mergedConfig.bypassCache || mergedConfig.refetchOnMount
  })
  
  const getMutationOptions = <T>(baseOptions: any): UseMutationOptions<T> => ({
    ...baseOptions
  })
  
  return {
    config: mergedConfig,
    getQueryOptions,
    getMutationOptions
  }
}