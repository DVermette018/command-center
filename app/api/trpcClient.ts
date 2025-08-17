import type { FetchClient } from '~~/types/types'

export const useTrpcClient = () => {
  const { $trpc } = useNuxtApp()
  // const config = useRuntimeConfig().public
  // const apiGatewayUrl = config.apiUrl
  // const authStore = useAuthStore()
  // const licenceStore = useLicenceStore()

  return $trpc
}
