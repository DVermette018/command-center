import type { useTrpcClient } from '~/api/trpcClient'
import type { Pagination, WithId } from '~~/types/common'

// export interface Pagination { page: number; pageSize: number }
export interface PageMeta { totalCount: number, totalPages: number }
export interface PaginatedResponse<T> { data: T[]; pagination: PageMeta }

export type FetchClient = ReturnType<typeof useTrpcClient>

export interface BaseService<T> {
  getAll(pagination: Pagination): Promise<PaginatedResponse<T>>
  create(payload: Partial<T>): Promise<T>
  update(payload: WithId<Partial<T>>): Promise<T>
  delete(id: number): Promise<void>
}
