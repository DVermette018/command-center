import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { UserRole } from '~~/types/user'
import type { ListUserDTO } from '~~/dto/user'
import type { BusinessDTO, CreateBusinessProfileDTO } from '~~/dto/business'
import type { CreateCustomerSchema } from '~~/dto/customer'

const trpc = () => useNuxtApp().$trpc

export interface BusinessService {
  store: () => ReturnType<typeof businessQueries.useStoreMutation>
}

export const businessQueries = defineService({
  queries: {
    // Define the queries here
  },
  mutations: {
    store: {
      request: (payload: CreateCustomerSchema) => trpc().customers.store.mutate(payload),
      cacheKey: () => [['CUSTOMERS_GET_ALL']]
    },
  }
})

export const businessService: BusinessService = {
  store: () => businessQueries.useStoreMutation(),
}
