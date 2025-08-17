import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { customerDTOSchema, createCustomerSchema } from '~~/dto/customer'
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

  store: baseProcedure
    .input(createCustomerSchema)
    .output(customerDTOSchema)
    .mutation(async ({ input }) => {
      const created = await repositories.customers.create(input)
      return customerDTOSchema.parse(created)
    })
})
