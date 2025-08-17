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

export interface CustomerService {
  getPeriodVariationByStatus: (params: PeriodVariationByStatusParams) => Promise<{
    currentPeriod: number
    percentageChange: number
  }>
  getAll (pagination: Pagination): Promise<PaginatedResponse<CustomerDTO>>
  getById (id: string): Promise<CustomerDTO>
  create (payload: CreateCustomerSchema): Promise<CustomerDTO>
  // update (payload: UpdateCustomerSchema): Promise<Customer>
  // delete (id: string): Promise<void>
}

export const customerQueries = defineService({
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
      request: (payload: CreateCustomerSchema) => trpc().customers.store.mutate(payload),
      cacheKey: () => [['CUSTOMERS_GET_ALL']]
    },
    // update: {
    //   request: (payload: UpdateCustomerSchema) =>
    //     trpc().customers.update.mutate(payload),
    //   cacheKey: (_payload, res) => [['CUSTOMERS_GET_ALL'], ['CUSTOMER_DETAIL', (res as Customer).id]]
    // },
    // delete: {
    //   request: (id: number) => trpc().customers.delete.mutate(id),
    //   cacheKey: (id) => [['CUSTOMERS_GET_ALL'], ['CUSTOMER_DETAIL', id]]
    // }
  }
})

export const customerService: CustomerService = {
  getPeriodVariationByStatus: (p: PeriodVariationByStatusParams) => customerQueries.getPeriodVariationByStatus(p),
  getAll: (p: Pagination) => customerQueries.getAll(p),
  getById: (id: string) => customerQueries.getById(id),
  create: (payload: CreateCustomerSchema) => customerQueries.callCreate()(payload),
  // update: (payload: UpdateCustomerSchema) => customerQueries.callUpdate()(payload),
  // delete: (id) => customerQueries.callDelete()(id)
}
