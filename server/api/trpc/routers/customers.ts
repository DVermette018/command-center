import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { customerDTOSchema, createCustomerSchema, updateCustomerSchema } from '~~/dto/customer'
import { CUSTOMER_STATUSES } from '~~/types/customers'
import { PERIODS } from '~~/types/common'
import { paginatedResponseSchema, paginationInputSchema } from '~~/dto/common'

export const registerRoutes = () => ({
  getPeriodVariationByStatus: baseProcedure
    .input(z.object({
      status: z.enum(CUSTOMER_STATUSES),
      period: z.enum(PERIODS),
      range: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
      })
    }))
    .output(z.object({
      currentPeriod: z.number().int().nonnegative(),
      percentageChange: z.number().int().nonnegative()
    }))
    .query(async (opts) => {
      return await repositories.customers.getPeriodVariationByStatus(
        opts.input.status,
        {
          start: new Date(opts.input.range.start),
          end: new Date(opts.input.range.end)
        },
        opts.input.period
      )
    }),

  getAll: baseProcedure
    .input(paginationInputSchema)
    .output(paginatedResponseSchema(customerDTOSchema))
    .query(async ({ input }) => {
      const result = await repositories.customers.getAll({
        pageIndex: input.pageIndex,
        pageSize: input.pageSize
      })

      return paginatedResponseSchema(customerDTOSchema).parse(result)
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .output(customerDTOSchema)
    .query(async ({ input }) => {
      const customer = await repositories.customers.getById(input.id)
      return customerDTOSchema.parse(customer)
    }),

  create: baseProcedure
    .input(createCustomerSchema)
    .output(customerDTOSchema)
    .mutation(async ({ input }) => {
      const created = await repositories.customers.create(input)
      return customerDTOSchema.parse(created)
    }),

  update: baseProcedure
    .input(updateCustomerSchema)
    .output(customerDTOSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      const updated = await repositories.customers.update(id, updateData)
      return customerDTOSchema.parse(updated)
    }),

  updateStatus: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'Customer ID is required'),
      status: z.enum(CUSTOMER_STATUSES),
      reason: z.string().optional()
    }))
    .output(customerDTOSchema)
    .mutation(async ({ input }) => {
      const updated = await repositories.customers.updateStatus(input.id, input.status, input.reason)
      return customerDTOSchema.parse(updated)
    }),

  delete: baseProcedure
    .input(z.object({ id: z.string().min(1, 'Customer ID is required') }))
    .output(z.object({
      success: z.boolean(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      return await repositories.customers.delete(input.id)
    }),

  search: baseProcedure
    .input(z.object({
      query: z.string().min(1, 'Search query is required'),
      pageIndex: z.number().int().min(1, 'Page index must be at least 1').default(1),
      pageSize: z.number().int().min(1, 'Page size must be at least 1').max(100, 'Page size cannot exceed 100').default(10)
    }))
    .output(paginatedResponseSchema(customerDTOSchema))
    .query(async ({ input }) => {
      const result = await repositories.customers.search(input.query, {
        pageIndex: input.pageIndex,
        pageSize: input.pageSize
      })
      return paginatedResponseSchema(customerDTOSchema).parse(result)
    })
})
