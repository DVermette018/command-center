import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import { type CreatePlanSchema, type PlanDTO } from '~~/dto/plan'

const trpc = () => useNuxtApp().$trpc

export interface PlanService {
  getAll (pagination: Pagination): Promise<PaginatedResponse<PlanDTO>>
  create (payload: CreatePlanSchema): Promise<PlanDTO>
  // update(payload: WithId<Partial<Plan>>): Promise<Plan>
  // delete(id: number): Promise<void>
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
  getAll: (p) => planQueries.getAll(p),
  create: (payload) => planQueries.callCreate()(payload),
  // update: (payload) => planQueries.callUpdate()(payload),
  // delete: (id) => planQueries.callDelete()(id)
}
