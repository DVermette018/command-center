import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client'
import { initializeGlobalErrorHandler } from '~/middleware/trpc-error-handler'
import type { AppRouter } from '~~/server/api/trpc/routers'

export default defineNuxtPlugin(() => {
  const toast = useToast()
  const { $queryClient } = useNuxtApp()

  // Initialize global error handler
  if (process.client) {
    initializeGlobalErrorHandler({
      toast,
      queryClient: $queryClient
    })
  }

  const trpc = createTRPCNuxtClient<AppRouter>({
    links: [
      httpBatchLink({ 
        url: '/api/trpc',
        // Add error handling for network requests
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, options)
            
            // Handle non-ok responses
            if (!response.ok) {
              const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
              // @ts-ignore - Add TRPC-like error data
              error.data = {
                code: response.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
                httpStatus: response.status
              }
              throw error
            }
            
            return response
          } catch (error) {
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
              const networkError = new Error('Network request failed')
              networkError.name = 'NetworkError'
              throw networkError
            }
            throw error
          }
        }
      })
    ]
  })

  return {
    provide: {
      trpc
    }
  }
})
