import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { BusinessDTO, CreateBusinessProfileDTO, UpdateBusinessProfileDTO } from '~~/dto/business'

const trpc = () => useNuxtApp().$trpc

export interface BusinessService {
  getAll: (pagination: Pagination) => ReturnType<typeof businessQueries.useGetAllQuery>
  getById: (id: string) => ReturnType<typeof businessQueries.useGetByIdQuery>
  search: (params: { query: string } & Pagination) => ReturnType<typeof businessQueries.useSearchQuery>
  store: () => ReturnType<typeof businessQueries.useStoreMutation>
  create: () => ReturnType<typeof businessQueries.useStoreMutation>
  update: () => ReturnType<typeof businessQueries.useUpdateMutation>
  delete: () => ReturnType<typeof businessQueries.useDeleteMutation>
}

export const businessQueries = defineService({
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

export const businessService: BusinessService = {
  getAll: (p: Pagination) => businessQueries.useGetAllQuery(p),
  getById: (id: string) => businessQueries.useGetByIdQuery(id),
  search: (params: { query: string } & Pagination) => businessQueries.useSearchQuery(params),
  store: () => businessQueries.useStoreMutation(),
  create: () => businessQueries.useStoreMutation(),
  update: () => businessQueries.useUpdateMutation(),
  delete: () => businessQueries.useDeleteMutation()
}
