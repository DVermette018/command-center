import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import { type CreatePlanSchema, type PlanDTO } from '~~/dto/plan'

const trpc = () => useNuxtApp().$trpc

export interface PlanService {
  getAll: (pagination: Pagination) => ReturnType<typeof planQueries.useGetAllQuery>
  create: () => ReturnType<typeof planQueries.useCreateMutation>
}

export const planQueries = defineService({
  queries: {
    getAll: {
      queryKey: (p: Pagination) => ['PLANS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().plans.getAll.query(p)
    }
  },
  mutations: {
    create: {
      request: (payload: CreatePlanSchema) => trpc().plans.store.mutate(payload),
      cacheKey: () => [['PLANS_GET_ALL']]
    },
    // update: {
    //   request: ({ id, ...payload }: WithId<Partial<Plan>>) =>
    //     trpc().plans.update.mutate({ id, ...payload }), // adjust to your router
    //   cacheKey: (_payload, res) => [['PLANS_GET_ALL'], ['PLAN_DETAIL', (res as Plan).id]]
    // },
    // delete: {
    //   request: (id: number) => trpc().plans.delete.mutate(id), // Promise<void>
    //   cacheKey: (id) => [['PLANS_GET_ALL'], ['PLAN_DETAIL', id]]
    // }
  }
})

export const planService: PlanService = {
  getAll: (p: Pagination) => planQueries.useGetAllQuery(p),
  create: () => planQueries.useCreateMutation(),
}
