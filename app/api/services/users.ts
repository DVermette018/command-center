import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination } from '~~/types/common'
import type { UserRole } from '~~/types/user'
import type { ListUserDTO } from '~~/dto/user'

const trpc = () => useNuxtApp().$trpc

export interface UserService {
  // TanStack Query hooks for components
  useGetAllByRolesQuery: (pagination: Pagination & { roles: UserRole[]}) => ReturnType<typeof userQueries.useGetAllByRolesQuery>
  
  // Direct call methods for server-side or utility usage
  getAllByRoles: (pagination: Pagination & { roles: UserRole[]}) => Promise<PaginatedResponse<ListUserDTO>>
}

export const userQueries = defineService({
  queries: {
    getAllByRoles: {
      queryKey: (p: Pagination & { roles: UserRole[]}) => ['USERS_GET_BY_ROLES', String(p?.pageIndex), String(p?.pageSize), p?.roles?.join(',')],
      queryFn: (p: Pagination & { roles: UserRole[]}) => trpc().users.getAllByRoles.query(p)
    }
  },
  mutations: {
    // Define any mutations if needed
  }
})

export const userService: UserService = {
  // TanStack Query hooks for components
  useGetAllByRolesQuery: (p: Pagination & { roles: UserRole[]}) => userQueries.useGetAllByRolesQuery(p),
  
  // Direct call methods for server-side or utility usage
  getAllByRoles: (p: Pagination & { roles: UserRole[]}) => userQueries.getAllByRoles(p),
}
