import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { register } from './business'
import type { CreateBusinessProfileDTO, UpdateBusinessProfileDTO } from '~~/dto/business'

// Mock Prisma Client
const mockPrismaClient = {
  businessProfile: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  $transaction: vi.fn()
} as unknown as PrismaClient

const businessRepository = register(mockPrismaClient)

describe('Business Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new business profile', async () => {
      const businessData: CreateBusinessProfileDTO = {
        businessName: 'Test Business',
        ownerName: 'John Owner',
        category: 'technology',
        email: 'contact@testbusiness.com',
        phone: '555-0123',
        addresses: [{
          type: 'BUSINESS',
          isPrimary: true,
          street: '123 Business St',
          street2: 'Suite 100',
          city: 'Business City',
          state: 'Business State',
          zipCode: '12345',
          country: 'US',
          reference: 'Near the mall'
        }]
      }

      const mockCreatedBusiness = {
        id: '1',
        businessName: 'Test Business',
        ownerName: 'John Owner',
        category: 'technology',
        email: 'contact@testbusiness.com',
        phone: '555-0123',
        legalName: null,
        taxId: null,
        website: null,
        size: null,
        customCategory: null,
        yearEstablished: null,
        description: null,
        productsServices: null,
        slogan: null,
        missionStatement: null,
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
        additionalColors: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        addresses: [{
          type: 'BUSINESS',
          isPrimary: true,
          street: '123 Business St',
          street2: 'Suite 100',
          city: 'Business City',
          state: 'Business State',
          zipCode: '12345',
          country: 'US',
          reference: 'Near the mall',
          coordinates: null
        }]
      }

      mockPrismaClient.businessProfile.create.mockResolvedValue(mockCreatedBusiness)

      const result = await businessRepository.create(businessData)

      expect(result).toEqual({
        businessName: 'Test Business',
        legalName: undefined,
        ownerName: 'John Owner',
        taxId: undefined,
        phone: '555-0123',
        email: 'contact@testbusiness.com',
        website: undefined,
        category: 'technology',
        size: undefined,
        customCategory: undefined,
        yearEstablished: undefined,
        description: undefined,
        productsServices: undefined,
        slogan: undefined,
        missionStatement: undefined,
        primaryColor: undefined,
        secondaryColor: undefined,
        accentColor: undefined,
        additionalColors: undefined,
        addresses: [{
          type: 'BUSINESS',
          street: '123 Business St',
          street2: 'Suite 100',
          city: 'Business City',
          state: 'Business State',
          zipCode: '12345',
          country: 'US',
          reference: 'Near the mall',
          isPrimary: true
        }]
      })

      expect(mockPrismaClient.businessProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessName: 'Test Business',
          ownerName: 'John Owner',
          category: 'technology'
        }),
        include: expect.any(Object)
      })
    })
  })

  describe('getById', () => {
    it('should fetch business profile by ID', async () => {
      const mockBusiness = {
        id: '1',
        businessName: 'Test Business',
        legalName: 'Test Business LLC',
        ownerName: 'John Owner',
        taxId: 'TAX123',
        phone: '555-0123',
        email: 'contact@test.com',
        website: 'https://test.com',
        category: 'technology',
        size: 'SMALL',
        customCategory: null,
        yearEstablished: null,
        description: null,
        productsServices: null,
        slogan: null,
        missionStatement: null,
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
        additionalColors: null,
        addresses: []
      }

      mockPrismaClient.businessProfile.findUnique.mockResolvedValue(mockBusiness)

      const result = await businessRepository.getById('1')

      expect(result).toEqual({
        businessName: 'Test Business',
        legalName: 'Test Business LLC',
        ownerName: 'John Owner',
        taxId: 'TAX123',
        phone: '555-0123',
        email: 'contact@test.com',
        website: 'https://test.com',
        category: 'technology',
        size: 'SMALL',
        customCategory: undefined,
        yearEstablished: undefined,
        description: undefined,
        productsServices: undefined,
        slogan: undefined,
        missionStatement: undefined,
        primaryColor: undefined,
        secondaryColor: undefined,
        accentColor: undefined,
        additionalColors: undefined,
        addresses: []
      })

      expect(mockPrismaClient.businessProfile.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object)
      })
    })

    it('should throw error if business not found', async () => {
      mockPrismaClient.businessProfile.findUnique.mockResolvedValue(null)

      await expect(businessRepository.getById('nonexistent')).rejects.toThrow(
        'Business profile with ID nonexistent not found'
      )
    })
  })

  describe('getAll', () => {
    it('should fetch all business profiles with pagination', async () => {
      const mockBusinesses = [
        {
          id: '1',
          businessName: 'Business 1',
          legalName: null,
          ownerName: 'Owner 1',
          taxId: null,
          phone: null,
          email: null,
          website: null,
          category: 'technology',
          size: null,
          customCategory: null,
          yearEstablished: null,
          description: null,
          productsServices: null,
          slogan: null,
          missionStatement: null,
          primaryColor: null,
          secondaryColor: null,
          accentColor: null,
          additionalColors: null,
          addresses: []
        }
      ]

      mockPrismaClient.$transaction.mockResolvedValue([mockBusinesses, 1])

      const result = await businessRepository.getAll({ pageIndex: 1, pageSize: 10 })

      expect(result).toEqual({
        data: [
          {
            businessName: 'Business 1',
            legalName: undefined,
            ownerName: 'Owner 1',
            taxId: undefined,
            phone: undefined,
            email: undefined,
            website: undefined,
            category: 'technology',
            size: undefined,
            customCategory: undefined,
            yearEstablished: undefined,
            description: undefined,
            productsServices: undefined,
            slogan: undefined,
            missionStatement: undefined,
            primaryColor: undefined,
            secondaryColor: undefined,
            accentColor: undefined,
            additionalColors: undefined,
            addresses: []
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

  describe('update', () => {
    it('should update business profile', async () => {
      const updateData: Partial<UpdateBusinessProfileDTO> = {
        businessName: 'Updated Business',
        website: 'https://updated.com',
        size: 'MEDIUM'
      }

      const mockUpdatedBusiness = {
        id: '1',
        businessName: 'Updated Business',
        legalName: 'Original Legal Name',
        ownerName: 'John Owner',
        taxId: 'TAX123',
        phone: '555-0123',
        email: 'contact@test.com',
        website: 'https://updated.com',
        category: 'technology',
        size: 'MEDIUM',
        customCategory: null,
        yearEstablished: null,
        description: null,
        productsServices: null,
        slogan: null,
        missionStatement: null,
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
        additionalColors: null,
        addresses: []
      }

      mockPrismaClient.businessProfile.update.mockResolvedValue(mockUpdatedBusiness)

      const result = await businessRepository.update('1', updateData)

      expect(result.businessName).toBe('Updated Business')
      expect(result.website).toBe('https://updated.com')
      expect(result.size).toBe('MEDIUM')

      expect(mockPrismaClient.businessProfile.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          businessName: 'Updated Business',
          website: 'https://updated.com',
          size: 'MEDIUM',
          updatedAt: expect.any(Date)
        }),
        include: expect.any(Object)
      })
    })

    it('should handle update errors', async () => {
      mockPrismaClient.businessProfile.update.mockRejectedValue(new Error('Business not found'))

      await expect(
        businessRepository.update('nonexistent', { businessName: 'Test' })
      ).rejects.toThrow('Business not found')
    })
  })

  describe('delete', () => {
    it('should delete business profile', async () => {
      mockPrismaClient.businessProfile.delete.mockResolvedValue({ id: '1' })

      const result = await businessRepository.delete('1')

      expect(result).toEqual({
        success: true,
        message: 'Business profile with ID 1 deleted successfully'
      })

      expect(mockPrismaClient.businessProfile.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      })
    })

    it('should handle delete errors', async () => {
      mockPrismaClient.businessProfile.delete.mockRejectedValue(new Error('Business not found'))

      await expect(businessRepository.delete('nonexistent')).rejects.toThrow('Business not found')
    })
  })

  describe('search', () => {
    it('should search business profiles by name', async () => {
      const mockBusinesses = [
        {
          id: '1',
          businessName: 'Tech Business',
          legalName: null,
          ownerName: 'Owner 1',
          taxId: null,
          phone: null,
          email: null,
          website: null,
          category: 'technology',
          size: null,
          customCategory: null,
          yearEstablished: null,
          description: null,
          productsServices: null,
          slogan: null,
          missionStatement: null,
          primaryColor: null,
          secondaryColor: null,
          accentColor: null,
          additionalColors: null,
          addresses: []
        }
      ]

      mockPrismaClient.$transaction.mockResolvedValue([mockBusinesses, 1])

      const result = await businessRepository.search('Tech', { pageIndex: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].businessName).toBe('Tech Business')
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1)
    })
  })
})