import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { defineNuxtPlugin, useState } from '#imports'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  // Modify your Vue Query global settings here
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 3,
        refetchOnWindowFocus: false,
        gcTime: 1000 * 60 * 10 // 10 minutes garbage collection time
      },
      mutations: {
        retry: 3
      }
    }
  })
  
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
