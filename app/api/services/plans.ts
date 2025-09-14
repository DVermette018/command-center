import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import { type CreatePlanSchema, type PlanDTO } from '~~/dto/plan'

const trpc = () => useNuxtApp().$trpc

export const registerService = defineService({
  queries: {
    getAll: {
      queryKey: (p: Pagination) => ['PLANS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().plans.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['PLANS_DETAIL', id],
      queryFn: (id: string) => trpc().plans.getById.query({ id })
    }
  },
  mutations: {
    create: {
      request: (payload: CreatePlanSchema) => trpc().plans.store.mutate(payload),
      cacheKey: () => [['PLANS_GET_ALL']]
    },
    update: {
      request: (payload: { id: string; [key: string]: any }) => trpc().plans.update.mutate(payload),
      cacheKey: (payload) => [['PLANS_GET_ALL'], ['PLANS_DETAIL', payload.id]]
    },
    delete: {
      request: ({ id }: { id: string }) => trpc().plans.delete.mutate({ id }),
      cacheKey: (variables: { id: string }) => [['PLANS_GET_ALL'], ['PLANS_DETAIL', variables.id]]
    }
  }
})
