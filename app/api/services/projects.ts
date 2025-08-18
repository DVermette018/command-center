import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination, Range } from '~~/types/common'
import { type CreateProjectDTO, type ProjectDTO } from '~~/dto/project'

const trpc = () => useNuxtApp().$trpc

export interface ProjectService {
  getAll: (pagination: Pagination) => ReturnType<typeof projectQueries.useGetAllQuery>
  getById: (id: string) => ReturnType<typeof projectQueries.useGetByIdQuery>
  create: () => ReturnType<typeof projectQueries.useStoreMutation>
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
  getAll: (p: Pagination) => projectQueries.useGetAllQuery(p),
  getById: (id: string) => projectQueries.useGetByIdQuery(id),
  create: () => projectQueries.useStoreMutation(),
}
