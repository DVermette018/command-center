import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { UserRole } from '~~/types/user'
import type { ListUserDTO, UserDTO, CreateUserDTO, UpdateUserDTO } from '~~/dto/user'

const trpc = () => useNuxtApp().$trpc

export interface UserService {
  getAllByRoles: (pagination: Pagination & { roles: UserRole[]}) => ReturnType<typeof userQueries.useGetAllByRolesQuery>
  getAll: (pagination: Pagination) => ReturnType<typeof userQueries.useGetAllQuery>
  getById: (id: string) => ReturnType<typeof userQueries.useGetByIdQuery>
  create: () => ReturnType<typeof userQueries.useCreateMutation>
  update: () => ReturnType<typeof userQueries.useUpdateMutation>
  delete: () => ReturnType<typeof userQueries.useDeleteMutation>
  reactivate: () => ReturnType<typeof userQueries.useReactivateMutation>
}

export const userQueries = defineService({
  queries: {
    getAllByRoles: {
      queryKey: (p: Pagination & { roles: UserRole[]}) => ['USERS_GET_BY_ROLES', String(p?.pageIndex), String(p?.pageSize), p?.roles?.join(',')],
      queryFn: (p: Pagination & { roles: UserRole[]}) => trpc().users.getAllByRoles.query(p)
    },
    getAll: {
      queryKey: (p: Pagination) => ['USERS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().users.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['USERS_GET_BY_ID', id],
      queryFn: (id: string) => trpc().users.getById.query({ id })
    }
  },
  mutations: {
    create: {
      request: (data: CreateUserDTO) => trpc().users.create.mutate(data),
      cacheKey: () => [['USERS_GET_ALL'], ['USERS_GET_BY_ROLES']]
    },
    update: {
      request: (data: UpdateUserDTO) => trpc().users.update.mutate(data),
      cacheKey: (data: UpdateUserDTO) => [
        ['USERS_GET_ALL'], 
        ['USERS_GET_BY_ROLES'],
        ['USERS_GET_BY_ID', data.id]
      ]
    },
    delete: {
      request: ({ id }: { id: string }) => trpc().users.delete.mutate({ id }),
      cacheKey: (variables: { id: string }) => [
        ['USERS_GET_ALL'],
        ['USERS_GET_BY_ROLES'],
        ['USERS_GET_BY_ID', variables.id]
      ]
    },
    reactivate: {
      request: ({ id }: { id: string }) => trpc().users.reactivate.mutate({ id }),
      cacheKey: (variables: { id: string }) => [
        ['USERS_GET_ALL'],
        ['USERS_GET_BY_ROLES'],
        ['USERS_GET_BY_ID', variables.id]
      ]
    }
  }
})

export const userService: UserService = {
  getAllByRoles: (p: Pagination & { roles: UserRole[]}) => userQueries.useGetAllByRolesQuery(p),
  getAll: (p: Pagination) => userQueries.useGetAllQuery(p),
  getById: (id: string) => userQueries.useGetByIdQuery(id),
  create: () => userQueries.useCreateMutation(),
  update: () => userQueries.useUpdateMutation(),
  delete: () => userQueries.useDeleteMutation(),
  reactivate: () => userQueries.useReactivateMutation()
}
