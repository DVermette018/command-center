import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import type { PaginatedResponse } from '~~/types/api'
import type { Plan } from '~~/types/plans'
import { apiPlanSchema, createPlanSchema } from '~~/dto/plan'
import { paginatedResponseSchema, paginationInputSchema } from '~~/dto/common'

export const registerRoutes = () => ({
  getAll: baseProcedure
    .input(paginationInputSchema)
    .output(paginatedResponseSchema(apiPlanSchema))
    .query(async ({ input }): Promise<PaginatedResponse<Plan>> => {
      const result = await repositories.plans.getAll({
        pageIndex: input.pageIndex,
        pageSize: input.pageSize
      })

      return paginatedResponseSchema(apiPlanSchema).parse(result)
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .output(apiPlanSchema) // optional but recommended
    .query(async ({ input }) => {
      const plan = await repositories.plans.getById(input.id)
      return apiPlanSchema.parse(plan)
    }),

  // Example mutation (adjust schema)
  store: baseProcedure
    .input(createPlanSchema)
    .output(apiPlanSchema)
    .mutation(async ({ input }) => {
      const created = await repositories.plans.create(input)
      return apiPlanSchema.parse(created)
    })
})
