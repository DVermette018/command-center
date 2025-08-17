import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const vueQueryOptions: VueQueryPluginOptions = {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: 3
        }
      }
    }
  }

  nuxtApp.vueApp.use(VueQueryPlugin, vueQueryOptions)
})
