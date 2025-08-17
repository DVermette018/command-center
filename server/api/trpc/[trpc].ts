import { createTRPCNuxtHandler } from 'trpc-nuxt/server'
import { createTRPCContext } from '~~/server/api/trpc/init'
import { appRouter } from '~~/server/api/trpc/routers'

export default createTRPCNuxtHandler({
  endpoint: '/api/trpc',
  router: appRouter,
  createContext: createTRPCContext
})
