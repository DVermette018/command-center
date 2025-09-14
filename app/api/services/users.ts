import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { UserRole } from '~~/types/user'
import type { ListUserDTO, UserDTO, CreateUserDTO, UpdateUserDTO } from '~~/dto/user'

const trpc = () => useNuxtApp().$trpc

export const registerService = defineService({
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
