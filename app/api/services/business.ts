import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { BusinessDTO, CreateBusinessProfileDTO, UpdateBusinessProfileDTO } from '~~/dto/business'

const trpc = () => useNuxtApp().$trpc

export const registerService = defineService({
  queries: {
    getAll: {
      queryKey: (p: Pagination) => ['BUSINESSES_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().business.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['BUSINESSES_GET_BY_ID', id],
      queryFn: (id: string) => trpc().business.getById.query({ id })
    },
    search: {
      queryKey: (params: { query: string } & Pagination) => ['BUSINESSES_SEARCH', params.query, String(params.pageIndex), String(params.pageSize)],
      queryFn: (params: { query: string } & Pagination) => trpc().business.search.query(params)
    }
  },
  mutations: {
    store: {
      request: (data: CreateBusinessProfileDTO) => trpc().business.store.mutate(data),
      cacheKey: () => [['BUSINESSES_GET_ALL'], ['BUSINESSES_SEARCH']]
    },
    create: {
      request: (data: CreateBusinessProfileDTO) => trpc().business.store.mutate(data),
      cacheKey: () => [['BUSINESSES_GET_ALL'], ['BUSINESSES_SEARCH']]
    },
    update: {
      request: (data: UpdateBusinessProfileDTO) => trpc().business.update.mutate(data),
      cacheKey: (data: UpdateBusinessProfileDTO) => [
        ['BUSINESSES_GET_ALL'],
        ['BUSINESSES_SEARCH'], 
        ['BUSINESSES_GET_BY_ID', data.id]
      ]
    },
    delete: {
      request: ({ id }: { id: string }) => trpc().business.delete.mutate({ id }),
      cacheKey: (variables: { id: string }) => [
        ['BUSINESSES_GET_ALL'],
        ['BUSINESSES_SEARCH'],
        ['BUSINESSES_GET_BY_ID', variables.id]
      ]
    }
  }
})
