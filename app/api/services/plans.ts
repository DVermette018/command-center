import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import { type CreatePlanSchema, type PlanDTO } from '~~/dto/plan'

const trpc = () => useNuxtApp().$trpc

export interface PlanService {
  // TanStack Query hooks for components
  useGetAllQuery: (pagination: Pagination) => ReturnType<typeof planQueries.useGetAllQuery>
  useCreateMutation: () => ReturnType<typeof planQueries.useCreateMutation>
  // useUpdateMutation: () => ReturnType<typeof planQueries.useUpdateMutation>
  // useDeleteMutation: () => ReturnType<typeof planQueries.useDeleteMutation>
  
  // Direct call methods for server-side or utility usage
  getAll: (pagination: Pagination) => Promise<PaginatedResponse<PlanDTO>>
  callCreate: () => (payload: CreatePlanSchema) => Promise<PlanDTO>
  // callUpdate: () => (payload: WithId<Partial<Plan>>) => Promise<Plan>
  // callDelete: () => (id: number) => Promise<void>
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
  // TanStack Query hooks for components
  useGetAllQuery: (p: Pagination) => planQueries.useGetAllQuery(p),
  useCreateMutation: () => planQueries.useCreateMutation(),
  // useUpdateMutation: () => planQueries.useUpdateMutation(),
  // useDeleteMutation: () => planQueries.useDeleteMutation(),
  
  // Direct call methods for server-side or utility usage
  getAll: (p: Pagination) => planQueries.getAll(p),
  callCreate: () => planQueries.callCreate(),
  // callUpdate: () => planQueries.callUpdate(),
  // callDelete: () => planQueries.callDelete()
}
