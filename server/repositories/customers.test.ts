import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { register } from './customers'
import type { CreateCustomerSchema } from '~~/dto/customer'

// Mock Prisma Client
const mockPrismaClient = {
  customer: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  user: {
    upsert: vi.fn()
  },
  $transaction: vi.fn()
} as unknown as PrismaClient

const customerRepository = register(mockPrismaClient)

describe('Customer Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPeriodVariationByStatus', () => {
    it('should calculate period variation correctly', async () => {
      const mockRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      }

      mockPrismaClient.customer.count
        .mockResolvedValueOnce(10) // current period
        .mockResolvedValueOnce(8)  // previous period

      const result = await customerRepository.getPeriodVariationByStatus('LEAD', mockRange, 'month')

      expect(result).toEqual({
        currentPeriod: 10,
        previousPeriod: 8,
        variation: 2,
        percentageChange: 25
      })

      expect(mockPrismaClient.customer.count).toHaveBeenCalledTimes(2)
    })

    it('should handle zero previous period', async () => {
      const mockRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      }

      mockPrismaClient.customer.count
        .mockResolvedValueOnce(10) // current period
        .mockResolvedValueOnce(0)  // previous period

      const result = await customerRepository.getPeriodVariationByStatus('LEAD', mockRange, 'month')

      expect(result.percentageChange).toBe(100)
    })

    it('should handle database errors', async () => {
      const mockRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      }

      mockPrismaClient.customer.count.mockRejectedValue(new Error('Database error'))

      await expect(
        customerRepository.getPeriodVariationByStatus('LEAD', mockRange, 'month')
      ).rejects.toThrow('Database error')
    })
  })

  describe('getAll', () => {
    it('should fetch paginated customers', async () => {
      const mockCustomers = [
        {
          id: '1',
          status: 'LEAD',
          source: 'website',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          contacts: [
            {
              id: '1',
              customerId: '1',
              position: 'Manager',
              department: 'Sales',
              isPrimary: true,
              user: {
                id: '1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'CUSTOMER',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01')
              }
            }
          ],
          businessProfile: {
            businessName: 'Test Company',
            legalName: 'Test Company LLC',
            ownerName: 'John Doe',
            taxId: 'TAX123',
            phone: '555-0123',
            email: 'info@test.com',
            website: 'https://test.com',
            category: 'technology',
            customCategory: null,
            size: 'SMALL',
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
            addresses: [
              {
                type: 'BUSINESS',
                isPrimary: true,
                street: '123 Main St',
                street2: 'Suite 100',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'MX',
                reference: 'Near the mall',
                coordinates: null
              }
            ]
          }
        }
      ]

      // Mock $transaction to return the expected query results
      mockPrismaClient.$transaction.mockImplementation((queries) => {
        // First query: findMany
        // Second query: count
        return Promise.resolve([mockCustomers, 1])
      })

      const result = await customerRepository.getAll({ pageIndex: 1, pageSize: 10 })

      expect(result).toEqual({
        data: [
          {
            id: '1',
            status: 'LEAD',
            source: 'website',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            contacts: [
              {
                id: '1',
                customerId: '1',
                position: 'Manager',
                department: 'Sales',
                isPrimary: true,
                user: {
                  id: '1',
                  email: 'test@example.com',
                  firstName: 'John',
                  lastName: 'Doe',
                  role: 'CUSTOMER',
                  isActive: true,
                  createdAt: '2023-01-01T00:00:00.000Z',
                  updatedAt: '2023-01-01T00:00:00.000Z'
                }
              }
            ],
            businessProfile: {
              businessName: 'Test Company',
              legalName: 'Test Company LLC',
              ownerName: 'John Doe',
              taxId: 'TAX123',
              phone: '555-0123',
              email: 'info@test.com',
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
              addresses: [
                {
                  type: 'BUSINESS',
                  street: '123 Main St',
                  street2: 'Suite 100',
                  city: 'Test City',
                  state: 'Test State',
                  zipCode: '12345',
                  country: 'MX',
                  reference: 'Near the mall',
                  isPrimary: true
                }
              ]
            }
          }
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1
        }
      })

      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1)
    })

    it('should handle pagination correctly', async () => {
      mockPrismaClient.$transaction.mockImplementation((queries) => {
        return Promise.resolve([[], 50])
      })

      await customerRepository.getAll({ pageIndex: 3, pageSize: 20 })

      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('getById', () => {
    it('should fetch customer by ID', async () => {
      const mockCustomer = {
        id: '1',
        status: 'LEAD',
        source: 'website',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        contacts: [],
        businessProfile: {
          businessName: 'Test Company',
          legalName: null,
          ownerName: null,
          taxId: null,
          phone: null,
          email: null,
          website: null,
          category: 'technology',
          customCategory: null,
          size: null,
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
      }

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer)

      const result = await customerRepository.getById('1')

      expect(result).toEqual({
        id: '1',
        status: 'LEAD',
        source: 'website',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        contacts: [],
        businessProfile: {
          businessName: 'Test Company',
          legalName: undefined,
          ownerName: undefined,
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
      })

      expect(mockPrismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object)
      })
    })

    it('should throw error if customer not found', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(null)

      await expect(customerRepository.getById('nonexistent')).rejects.toThrow(
        'Customer with ID nonexistent not found'
      )
    })
  })

  describe('create', () => {
    it('should create customer with business profile and contact', async () => {
      const mockUser = {
        id: '1',
        email: 'contact@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }

      const mockCustomer = {
        id: '1',
        status: 'LEAD',
        source: 'website',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        contacts: [
          {
            id: '1',
            customerId: '1',
            position: 'Manager',
            department: 'Sales',
            isPrimary: true,
            user: mockUser
          }
        ],
        businessProfile: {
          businessName: 'Test Company',
          legalName: 'Test Company LLC',
          ownerName: 'John Doe',
          taxId: 'TAX123',
          phone: '555-0123',
          email: 'info@test.com',
          website: null,
          category: 'technology',
          customCategory: null,
          size: 'SMALL',
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
      }

      const customerData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          legalName: 'Test Company LLC',
          ownerName: 'John Doe',
          taxId: 'TAX123',
          phone: '555-0123',
          email: 'info@test.com',
          category: 'technology',
          size: 'SMALL',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: 'Suite 100',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: 'Near the mall'
          }
        },
        status: 'LEAD',
        source: 'website',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          position: 'Manager',
          department: 'Sales',
          isPrimary: true
        }
      }

      mockPrismaClient.user.upsert.mockResolvedValue(mockUser)
      mockPrismaClient.customer.create.mockResolvedValue(mockCustomer)

      const result = await customerRepository.create(customerData)

      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { email: 'contact@test.com' },
        update: {},
        create: expect.objectContaining({
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CUSTOMER',
          isActive: true
        })
      })

      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source: 'website',
          status: 'LEAD',
          contacts: {
            create: expect.objectContaining({
              position: 'Manager',
              department: 'Sales',
              userId: '1',
              isPrimary: true
            })
          },
          businessProfile: {
            create: expect.objectContaining({
              businessName: 'Test Company',
              ownerName: 'John Doe',
              addresses: {
                create: expect.objectContaining({
                  type: 'BUSINESS',
                  street: '123 Main St',
                  city: 'Test City'
                })
              }
            })
          }
        }),
        select: expect.any(Object)
      })

      expect(result.id).toBe('1')
      expect(result.businessProfile?.businessName).toBe('Test Company')
    })

    it('should handle creation errors', async () => {
      const customerData: CreateCustomerSchema = {
        business: {
          businessName: 'Test Company',
          ownerName: 'John Doe',
          category: 'technology',
          address: {
            type: 'BUSINESS',
            isPrimary: true,
            street: '123 Main St',
            street2: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'MX',
            reference: ''
          }
        },
        status: 'LEAD',
        contact: {
          id: '',
          customerId: '',
          email: 'contact@test.com',
          firstName: 'John',
          lastName: 'Doe',
          isPrimary: true
        }
      }

      mockPrismaClient.user.upsert.mockResolvedValue({
        id: '1',
        email: 'contact@test.com'
      })
      mockPrismaClient.customer.create.mockRejectedValue(new Error('Creation failed'))

      await expect(customerRepository.create(customerData)).rejects.toThrow('Creation failed')
    })
  })
})