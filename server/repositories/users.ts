import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { User, UserRole } from '~~/types/user'
import type { PaginatedResponse } from '~~/types/api'
import type { ListUserDTO } from '~~/dto/user'

export const register = (db: PrismaClient) => ({
  getAllByRoles: async (pagination: Pagination, roles: UserRole[]): Promise<PaginatedResponse<ListUserDTO>> => {
    try {
      const [users, usersCount] = await db.$transaction([
        db.user.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' },
          where: { role: { in: roles } },
        }),
        db.user.count({ where: { role: { in: roles } } })
      ])

      return {
        data: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        })),
        pagination: {
          totalCount: usersCount,
          totalPages: Math.ceil(usersCount / Math.max(1, pagination.pageSize))
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }
})
