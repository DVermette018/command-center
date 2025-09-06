import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { businessSchema, createBusinessProfileSchema, updateBusinessProfileSchema } from '~~/dto/business'
import { paginatedResponseSchema } from '~~/dto/common'

export const registerRoutes = () => ({
  store: baseProcedure
    .input(createBusinessProfileSchema)
    .output(businessSchema)
    .mutation(async ({ input }) => {
      const business = await repositories.business.create(input)
      return businessSchema.parse(business)
    }),

  getAll: baseProcedure
    .input(
      z.object({
        pageIndex: z.number().min(1, 'Page index must be at least 1').optional().default(1),
        pageSize: z.number().min(1, 'Page size must be at least 1').max(100, 'Page size cannot exceed 100').optional().default(10)
      })
    )
    .output(paginatedResponseSchema(businessSchema))
    .query(async ({ input }) => {
      const businesses = await repositories.business.getAll(input)
      return paginatedResponseSchema(businessSchema).parse(businesses)
    }),

  getById: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'Business ID is required')
    }))
    .output(businessSchema)
    .query(async ({ input }) => {
      const business = await repositories.business.getById(input.id)
      return businessSchema.parse(business)
    }),

  update: baseProcedure
    .input(updateBusinessProfileSchema)
    .output(businessSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      const business = await repositories.business.update(id, updateData)
      return businessSchema.parse(business)
    }),

  delete: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'Business ID is required')
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      const result = await repositories.business.delete(input.id)
      return result
    }),

  search: baseProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Search query is required'),
        pageIndex: z.number().min(1, 'Page index must be at least 1').optional().default(1),
        pageSize: z.number().min(1, 'Page size must be at least 1').max(100, 'Page size cannot exceed 100').optional().default(10)
      })
    )
    .output(paginatedResponseSchema(businessSchema))
    .query(async ({ input }) => {
      const { query, ...pagination } = input
      const businesses = await repositories.business.search(query, pagination)
      return paginatedResponseSchema(businessSchema).parse(businesses)
    })

})
