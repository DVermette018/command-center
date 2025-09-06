import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { User, UserRole } from '~~/types/user'
import type { PaginatedResponse } from '~~/types/api'
import type { ListUserDTO, UserDTO, CreateUserDTO, UpdateUserDTO } from '~~/dto/user'

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
  },

  getById: async (id: string): Promise<UserDTO> => {
    try {
      const user = await db.user.findUnique({
        where: { id }
      })

      if (!user) {
        throw new Error(`User with ID ${id} not found`)
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error)
      throw error
    }
  },

  getAll: async (pagination: Pagination): Promise<PaginatedResponse<UserDTO>> => {
    try {
      const [users, usersCount] = await db.$transaction([
        db.user.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' }
        }),
        db.user.count()
      ])

      return {
        data: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        })),
        pagination: {
          totalCount: usersCount,
          totalPages: Math.ceil(usersCount / Math.max(1, pagination.pageSize))
        }
      }
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  },

  create: async (userData: CreateUserDTO): Promise<UserDTO> => {
    try {
      const user = await db.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isActive: userData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  update: async (id: string, updateData: Partial<UpdateUserDTO>): Promise<UserDTO> => {
    try {
      const user = await db.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error)
      throw error
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await db.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        message: `User with ID ${id} deactivated successfully`
      }
    } catch (error) {
      console.error(`Error deactivating user with ID ${id}:`, error)
      throw error
    }
  },

  reactivate: async (id: string): Promise<UserDTO> => {
    try {
      const user = await db.user.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      })

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    } catch (error) {
      console.error(`Error reactivating user with ID ${id}:`, error)
      throw error
    }
  }
})
