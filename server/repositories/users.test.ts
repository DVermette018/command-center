import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { register } from './users'
import type { CreateUserDTO, UpdateUserDTO } from '~~/dto/user'

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  $transaction: vi.fn()
} as unknown as PrismaClient

const userRepository = register(mockPrismaClient)

describe('User Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllByRoles', () => {
    it('should fetch users by roles with pagination', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'designer@example.com',
          firstName: 'John',
          lastName: 'Designer',
          role: 'DESIGNER',
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        }
      ]

      mockPrismaClient.$transaction.mockResolvedValue([mockUsers, 1])

      const result = await userRepository.getAllByRoles(
        { pageIndex: 1, pageSize: 10 },
        ['DESIGNER', 'DEVELOPER']
      )

      expect(result).toEqual({
        data: [
          {
            id: '1',
            email: 'designer@example.com',
            firstName: 'John',
            lastName: 'Designer',
            role: 'DESIGNER'
          }
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1
        }
      })

      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('getById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = {
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

      const result = await userRepository.getById('1')

      expect(result).toEqual({
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      })

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      })
    })

    it('should throw error if user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      await expect(userRepository.getById('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found'
      )
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const userData: CreateUserDTO = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'DEVELOPER',
        isActive: true
      }

      const mockCreatedUser = {
        id: '1',
        ...userData,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }

      mockPrismaClient.user.create.mockResolvedValue(mockCreatedUser)

      const result = await userRepository.create(userData)

      expect(result).toEqual({
        id: '1',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      })

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'DEVELOPER',
          isActive: true
        })
      })
    })

    it('should handle creation errors', async () => {
      const userData: CreateUserDTO = {
        email: 'duplicate@example.com',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'DEVELOPER',
        isActive: true
      }

      mockPrismaClient.user.create.mockRejectedValue(new Error('Email already exists'))

      await expect(userRepository.create(userData)).rejects.toThrow('Email already exists')
    })
  })

  describe('update', () => {
    it('should update user data', async () => {
      const updateData: Partial<UpdateUserDTO> = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'PROJECT_MANAGER'
      }

      const mockUpdatedUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'PROJECT_MANAGER',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      }

      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser)

      const result = await userRepository.update('1', updateData)

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'PROJECT_MANAGER',
        isActive: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      })

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          firstName: 'Updated',
          lastName: 'Name',
          role: 'PROJECT_MANAGER',
          updatedAt: expect.any(Date)
        })
      })
    })

    it('should handle update errors', async () => {
      mockPrismaClient.user.update.mockRejectedValue(new Error('User not found'))

      await expect(
        userRepository.update('nonexistent', { firstName: 'Test' })
      ).rejects.toThrow('User not found')
    })
  })

  describe('delete', () => {
    it('should soft delete user by setting isActive to false', async () => {
      const mockDeactivatedUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        isActive: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      }

      mockPrismaClient.user.update.mockResolvedValue(mockDeactivatedUser)

      const result = await userRepository.delete('1')

      expect(result).toEqual({
        success: true,
        message: 'User with ID 1 deactivated successfully'
      })

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should handle delete errors', async () => {
      mockPrismaClient.user.update.mockRejectedValue(new Error('User not found'))

      await expect(userRepository.delete('nonexistent')).rejects.toThrow('User not found')
    })
  })

  describe('reactivate', () => {
    it('should reactivate a deactivated user', async () => {
      const mockReactivatedUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      }

      mockPrismaClient.user.update.mockResolvedValue(mockReactivatedUser)

      const result = await userRepository.reactivate('1')

      expect(result).toEqual({
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      })

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: true,
          updatedAt: expect.any(Date)
        }
      })
    })
  })

  describe('getAll', () => {
    it('should fetch all users with pagination', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DEVELOPER',
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: '2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'DESIGNER',
          isActive: true,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        }
      ]

      mockPrismaClient.$transaction.mockResolvedValue([mockUsers, 2])

      const result = await userRepository.getAll({ pageIndex: 1, pageSize: 10 })

      expect(result).toEqual({
        data: [
          {
            id: '1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'DEVELOPER',
            isActive: true,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          },
          {
            id: '2',
            email: 'user2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'DESIGNER',
            isActive: true,
            createdAt: '2023-01-02T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z'
          }
        ],
        pagination: {
          totalCount: 2,
          totalPages: 1
        }
      })

      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1)
    })
  })
})