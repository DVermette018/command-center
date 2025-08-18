import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination, Range } from '~~/types/common'
import { type CreateProjectDTO, type ProjectDTO } from '~~/dto/project'

const trpc = () => useNuxtApp().$trpc

export interface ProjectService {
  // TanStack Query hooks for components
  useGetAllQuery: (pagination: Pagination) => ReturnType<typeof projectQueries.useGetAllQuery>
  useGetByIdQuery: (id: string) => ReturnType<typeof projectQueries.useGetByIdQuery>
  useStoreMutation: () => ReturnType<typeof projectQueries.useStoreMutation>
  
  // Direct call methods for server-side or utility usage
  getAll: (pagination: Pagination) => Promise<PaginatedResponse<ProjectDTO>>
  getById: (id: string) => Promise<ProjectDTO>
  callStore: () => (payload: CreateProjectDTO) => Promise<ProjectDTO>
}

export const projectQueries = defineService({
  queries: {
    getAll: {
      queryKey: (p: Pagination) => ['PROJECTS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().projects.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['PROJECTS_DETAIL', id],
      queryFn: (id: string) => trpc().projects.getById.query({ id })
    }
  },
  mutations: {
    store: {
      request: (payload: CreateProjectDTO) => trpc().projects.store.mutate(payload),
      cacheKey: () => [['PROJECTS_GET_ALL']]
    },
  }
})

export const projectService: ProjectService = {
  // TanStack Query hooks for components
  useGetAllQuery: (p: Pagination) => projectQueries.useGetAllQuery(p),
  useGetByIdQuery: (id: string) => projectQueries.useGetByIdQuery(id),
  useStoreMutation: () => projectQueries.useStoreMutation(),
  
  // Direct call methods for server-side or utility usage
  getAll: (p: Pagination) => projectQueries.getAll(p),
  getById: (id: string) => projectQueries.getById(id),
  callStore: () => projectQueries.callStore(),
}
