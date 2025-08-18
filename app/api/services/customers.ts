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
  useGetPeriodVariationByStatusQuery: (params: PeriodVariationByStatusParams) => ReturnType<typeof customerQueries.useGetPeriodVariationByStatusQuery>
  useGetAllQuery: (pagination: Pagination) => ReturnType<typeof customerQueries.useGetAllQuery>
  useGetByIdQuery: (id: string) => ReturnType<typeof customerQueries.useGetByIdQuery>
  useCreateMutation: () => ReturnType<typeof customerQueries.useCreateMutation>
  // useUpdateMutation: () => ReturnType<typeof customerQueries.useUpdateMutation>
  // useDeleteMutation: () => ReturnType<typeof customerQueries.useDeleteMutation>
  
  // Direct call methods for server-side or utility usage
  getPeriodVariationByStatus: (params: PeriodVariationByStatusParams) => Promise<any>
  getAll: (pagination: Pagination) => Promise<any>
  getById: (id: string) => Promise<any>
  callCreate: () => (payload: CreateCustomerSchema) => Promise<any>
  // callUpdate: () => (payload: UpdateCustomerSchema) => Promise<any>
  // callDelete: () => (id: string) => Promise<any>
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
  // TanStack Query hooks for components
  useGetPeriodVariationByStatusQuery: (p: PeriodVariationByStatusParams) => customerQueries.useGetPeriodVariationByStatusQuery(p),
  useGetAllQuery: (p: Pagination) => customerQueries.useGetAllQuery(p),
  useGetByIdQuery: (id: string) => customerQueries.useGetByIdQuery(id),
  useCreateMutation: () => customerQueries.useCreateMutation(),
  // useUpdateMutation: () => customerQueries.useUpdateMutation(),
  // useDeleteMutation: () => customerQueries.useDeleteMutation(),
  
  // Direct call methods for server-side or utility usage
  getPeriodVariationByStatus: (p: PeriodVariationByStatusParams) => customerQueries.getPeriodVariationByStatus(p),
  getAll: (p: Pagination) => customerQueries.getAll(p),
  getById: (id: string) => customerQueries.getById(id),
  callCreate: () => customerQueries.callCreate(),
  // callUpdate: () => customerQueries.callUpdate(),
  // callDelete: () => customerQueries.callDelete()
}
