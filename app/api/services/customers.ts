import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination, Period, Range } from '~~/types/common'
import type { CreateCustomerSchema, CustomerDTO, UpdateCustomerSchema } from '~~/dto/customer'
import type { Customer, CustomerStatus } from '~~/types/customers'

const trpc = () => useNuxtApp().$trpc

export interface PeriodVariationByStatusParams {
  status: string
  period: string
  range: Range
}

export const registerService = defineService({
  queries: {
    getPeriodVariationByStatus: {
      queryKey: (p: PeriodVariationByStatusParams) => ['CUSTOMERS_GET_PERIOD_VARIATION_BY_STATUS', p.status, p.period, p.range.start.toString(), p.range.end.toString()],
      queryFn: (p: PeriodVariationByStatusParams) =>
        trpc().customers.getPeriodVariationByStatus.query({
          status: p.status as CustomerStatus,
          period: p.period as Period,
          range: {
            start: p.range.start.toISOString(),
            end: p.range.end.toISOString()
          }
        })
    },
    getAll: {
      queryKey: (p: Pagination) => ['CUSTOMERS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().customers.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['CUSTOMER_DETAIL', id],
      queryFn: (id: string) => trpc().customers.getById.query({ id })
    }
  },
  mutations: {
    create: {
      request: (payload: CreateCustomerSchema) => trpc().customers.create.mutate(payload),
      cacheKey: () => [['CUSTOMERS_GET_ALL']]
    },
    updateStatus: {
      request: (payload: { id: string; status: CustomerStatus; reason?: string }) => 
        trpc().customers.updateStatus.mutate(payload),
      cacheKey: (_payload, res) => [['CUSTOMERS_GET_ALL'], ['CUSTOMER_DETAIL', (res as CustomerDTO).id]]
    },
    update: {
      request: (payload: UpdateCustomerSchema) => trpc().customers.update.mutate(payload),
      cacheKey: (payload) => [['CUSTOMERS_GET_ALL'], ['CUSTOMER_DETAIL', payload.id]]
    },
    delete: {
      request: (payload: { id: string }) => trpc().customers.delete.mutate(payload),
      cacheKey: (payload) => [['CUSTOMERS_GET_ALL'], ['CUSTOMER_DETAIL', payload.id]]
    }
  }
})
