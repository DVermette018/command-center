import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { defineNuxtPlugin, useState } from '#imports'
import { classifyError, isNetworkError, isTRPCError } from '~/utils/error'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  // Modify your Vue Query global settings here
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
          const classification = classifyError(error as Error)
          
          // Don't retry non-retryable errors
          if (!classification.isRetryable) {
            return false
          }
          
          // Limit retries based on error type
          const maxRetries = classification.type === 'network' ? 5 : 3
          return failureCount < maxRetries
        },
        retryDelay: (attemptIndex, error) => {
          const classification = classifyError(error as Error)
          const baseDelay = classification.type === 'network' ? 2000 : 1000
          const maxDelay = 30000
          
          // Exponential backoff with jitter
          const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay)
          const jitter = Math.random() * 0.1 * exponentialDelay
          return exponentialDelay + jitter
        },
        refetchOnWindowFocus: false,
        gcTime: 1000 * 60 * 10, // 10 minutes garbage collection time
        networkMode: 'offlineFirst' // Continue to show cached data when offline
      },
      mutations: {
        retry: (failureCount, error) => {
          const classification = classifyError(error as Error)
          
          // Don't retry client errors (except rate limiting)
          if (!classification.isRetryable) {
            return false
          }
          
          // Limit mutation retries more strictly
          return failureCount < 2
        },
        retryDelay: (attemptIndex, error) => {
          const classification = classifyError(error as Error)
          const baseDelay = 1500
          const maxDelay = 10000
          
          return Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay)
        },
        networkMode: 'online' // Only allow mutations when online
      }
    }
  })
  
  // Add global error handlers
  if (process.client) {
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'error') {
        const { query, error } = event
        
        // Handle query errors globally
        const classification = classifyError(error as Error)
        
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Vue Query error:', { query: query.queryKey, error, classification })
        }
        
        // Could integrate with error reporting service here
      }
    })

    queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'error') {
        const { mutation, error } = event
        
        // Handle mutation errors globally
        const classification = classifyError(error as Error)
        
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Vue Query mutation error:', { mutation: mutation.options, error, classification })
        }
        
        // Could integrate with global error handler here
      }
    })
  }
  
  const options: VueQueryPluginOptions = { queryClient }

  nuxt.vueApp.use(VueQueryPlugin, options)
  
  // Enable devtools in development
  if (import.meta.client && import.meta.dev) {
    nuxt.vueApp.use(VueQueryDevtools)
  }

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    nuxt.hooks.hook('app:created', () => {
      const dehydratedState = vueQueryState.value
      if (dehydratedState) {
        hydrate(queryClient, dehydratedState)
      }
    })
  }
})
