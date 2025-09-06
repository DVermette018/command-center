import { PrismaClient } from '@prisma/client'
import { appRouter } from '~~/server/api/trpc/init'
import { TestDataFactory } from '~~/test/helpers/test-data-factory'
import { createTestDatabase } from '~~/test/helpers/test-database'
import { createCaller } from '~~/server/api/trpc/context'

describe('Business Profile API Integration Tests', () => {
  let prisma: PrismaClient
  let testDataFactory: TestDataFactory
  let caller: ReturnType<typeof createCaller>

  beforeAll(async () => {
    prisma = createTestDatabase()
    testDataFactory = new TestDataFactory(prisma)
    caller = createCaller({ prisma })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clear database before each test
    await prisma.businessProfile.deleteMany()
    await prisma.customer.deleteMany()
  })

  describe('Business Profile CRUD Operations', () => {
    let customerId: string

    beforeEach(async () => {
      // Create a customer to associate with business profiles
      const customer = await testDataFactory.createCustomerInDb()
      customerId = customer.id
    })

    test('store: should create a complete business profile with all details', async () => {
      const businessProfileData = {
        businessName: 'Acme Innovations',
        legalName: 'Acme Inc.',
        ownerName: 'John Doe',
        taxId: '12-3456789',
        phone: '(555) 123-4567',
        email: 'john@acmeinnovations.com',
        website: 'https://www.acmeinnovations.com',
        category: 'Technology',
        size: 'SMALL',
        yearEstablished: 2010,
        slogan: 'Innovating Tomorrow',
        missionStatement: 'To provide cutting-edge solutions',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        accentColor: '#3357FF',
        address: {
          street: '123 Innovation Way',
          city: 'Tech City',
          state: 'CA',
          zipCode: '90210',
          country: 'US'
        }
      }

      const createdBusiness = await caller.business.store({
        ...businessProfileData,
        customerId
      })

      expect(createdBusiness).toMatchObject({
        ...businessProfileData,
        id: expect.any(String)
      })

      // Verify database record
      const dbBusiness = await prisma.businessProfile.findUnique({
        where: { id: createdBusiness.id },
        include: { addresses: true }
      })
      expect(dbBusiness).toBeTruthy()
      expect(dbBusiness?.addresses.length).toBe(1)
    })

    test('store: should create a business profile with minimal required data', async () => {
      const businessProfileData = {
        businessName: 'Minimal Business',
        ownerName: 'Jane Smith',
        category: 'Services',
        address: {
          street: '456 Simple St',
          city: 'Simpleville',
          state: 'NY',
          zipCode: '12345'
        }
      }

      const createdBusiness = await caller.business.store({
        ...businessProfileData,
        customerId
      })

      expect(createdBusiness).toMatchObject({
        businessName: 'Minimal Business',
        ownerName: 'Jane Smith',
        category: 'Services'
      })
    })

    test('getById: should retrieve a specific business profile', async () => {
      const businessProfile = await testDataFactory.createBusinessProfileInDb(customerId, {
        businessName: 'Test Retrieval Business',
        category: 'Retail'
      })

      const retrievedBusiness = await caller.business.getById({ 
        id: businessProfile.id 
      })

      expect(retrievedBusiness).toMatchObject({
        id: businessProfile.id,
        businessName: 'Test Retrieval Business',
        category: 'Retail'
      })
    })

    test('update: should update business profile details', async () => {
      const businessProfile = await testDataFactory.createBusinessProfileInDb(customerId, {
        businessName: 'Original Business',
        category: 'Consulting'
      })

      const updatedBusiness = await caller.business.update({
        id: businessProfile.id,
        businessName: 'Updated Business Name',
        category: 'Technology',
        description: 'A new description for the business',
        yearEstablished: 2015
      })

      expect(updatedBusiness).toMatchObject({
        id: businessProfile.id,
        businessName: 'Updated Business Name',
        category: 'Technology',
        description: 'A new description for the business',
        yearEstablished: 2015
      })
    })

    test('delete: should delete a business profile', async () => {
      const businessProfile = await testDataFactory.createBusinessProfileInDb(customerId)

      const deleteResult = await caller.business.delete({ 
        id: businessProfile.id 
      })

      expect(deleteResult).toMatchObject({
        success: true,
        message: expect.any(String)
      })

      // Verify deletion
      const deletedBusiness = await prisma.businessProfile.findUnique({
        where: { id: businessProfile.id }
      })
      expect(deletedBusiness).toBeNull()
    })

    test('getAll: should retrieve paginated business profiles', async () => {
      // Create multiple business profiles
      await Promise.all([
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Business 1' }),
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Business 2' }),
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Business 3' })
      ])

      const paginatedBusinesses = await caller.business.getAll({
        pageIndex: 1,
        pageSize: 2
      })

      expect(paginatedBusinesses.items).toHaveLength(2)
      expect(paginatedBusinesses.total).toBe(3)
      expect(paginatedBusinesses.pageIndex).toBe(1)
      expect(paginatedBusinesses.pageSize).toBe(2)
    })

    test('search: should search business profiles', async () => {
      await Promise.all([
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Tech Solutions Inc' }),
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Tech Innovations Ltd' }),
        testDataFactory.createBusinessProfileInDb(customerId, { businessName: 'Marketing Pros' })
      ])

      const searchResults = await caller.business.search({
        query: 'Tech',
        pageSize: 2
      })

      expect(searchResults.items).toHaveLength(2)
      expect(searchResults.total).toBe(2)
      expect(searchResults.items.some(b => b.businessName.includes('Tech'))).toBeTruthy()
    })
  })

  describe('Complex Business Profile Scenarios', () => {
    let customerId: string

    beforeEach(async () => {
      const customer = await testDataFactory.createCustomerInDb()
      customerId = customer.id
    })

    test('store: should create business profile with multiple addresses', async () => {
      const businessProfileData = {
        businessName: 'Multi-Location Enterprise',
        ownerName: 'Sarah Johnson',
        category: 'Retail',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          type: 'BUSINESS'
        },
        addresses: [
          {
            street: '456 Billing Ave',
            city: 'Brooklyn',
            state: 'NY',
            zipCode: '11201',
            type: 'BILLING'
          },
          {
            street: '789 Shipping Rd',
            city: 'Queens',
            state: 'NY',
            zipCode: '11351',
            type: 'SHIPPING'
          }
        ]
      }

      const createdBusiness = await caller.business.store({
        ...businessProfileData,
        customerId
      })

      const dbBusiness = await prisma.businessProfile.findUnique({
        where: { id: createdBusiness.id },
        include: { addresses: true }
      })

      expect(dbBusiness?.addresses).toHaveLength(3)
      expect(dbBusiness?.addresses.map(a => a.type)).toEqual(
        expect.arrayContaining(['BUSINESS', 'BILLING', 'SHIPPING'])
      )
    })

    test('store: should create business profile with business schedules', async () => {
      const businessProfileData = {
        businessName: 'Scheduling Masters',
        ownerName: 'Alex Chen',
        category: 'Services',
        address: {
          street: '100 Work Blvd',
          city: 'Worktown',
          state: 'CA',
          zipCode: '90210'
        },
        schedules: [
          {
            dayOfWeek: 'MONDAY',
            openTime: '09:00',
            closeTime: '17:00',
            breakStart: '12:00',
            breakEnd: '13:00'
          },
          {
            dayOfWeek: 'SATURDAY',
            isClosed: true
          }
        ]
      }

      const createdBusiness = await caller.business.store({
        ...businessProfileData,
        customerId
      })

      const dbBusiness = await prisma.businessProfile.findUnique({
        where: { id: createdBusiness.id },
        include: { schedules: true }
      })

      expect(dbBusiness?.schedules).toHaveLength(2)
      const monday = dbBusiness?.schedules.find(s => s.dayOfWeek === 'MONDAY')
      const saturday = dbBusiness?.schedules.find(s => s.dayOfWeek === 'SATURDAY')

      expect(monday).toMatchObject({
        openTime: '09:00',
        closeTime: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00'
      })
      expect(saturday?.isClosed).toBe(true)
    })

    test('store: should create business profile with social media profiles', async () => {
      const businessProfileData = {
        businessName: 'Social Media Pro',
        ownerName: 'Maria Rodriguez',
        category: 'Marketing',
        address: {
          street: '200 Social St',
          city: 'MediaCity',
          state: 'CA',
          zipCode: '90210'
        },
        socialMedia: [
          {
            platform: 'FACEBOOK',
            url: 'https://facebook.com/socialmediapro',
            username: 'socialmediapro',
            isActive: true
          },
          {
            platform: 'INSTAGRAM',
            url: 'https://instagram.com/socialmediapro',
            isActive: true
          }
        ]
      }

      const createdBusiness = await caller.business.store({
        ...businessProfileData,
        customerId
      })

      const dbBusiness = await prisma.businessProfile.findUnique({
        where: { id: createdBusiness.id },
        include: { socialMedia: true }
      })

      expect(dbBusiness?.socialMedia).toHaveLength(2)
      expect(dbBusiness?.socialMedia.map(sm => sm.platform)).toEqual(
        expect.arrayContaining(['FACEBOOK', 'INSTAGRAM'])
      )
    })
  })

  describe('Validation Scenarios', () => {
    let customerId: string

    beforeEach(async () => {
      const customer = await testDataFactory.createCustomerInDb()
      customerId = customer.id
    })

    test('store: should fail with invalid business name', async () => {
      await expect(
        caller.business.store({
          businessName: '', // Empty business name
          ownerName: 'Test Owner',
          category: 'Test',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          }
        })
      ).rejects.toThrow('Business name is required')
    })

    test('update: should fail with invalid email', async () => {
      const businessProfile = await testDataFactory.createBusinessProfileInDb(customerId)

      await expect(
        caller.business.update({
          id: businessProfile.id,
          email: 'invalid-email'
        })
      ).rejects.toThrow('Invalid email format')
    })

    test('store: should fail with invalid address data', async () => {
      await expect(
        caller.business.store({
          businessName: 'Invalid Address Business',
          ownerName: 'Test Owner',
          category: 'Test',
          address: {
            street: '', // Empty street
            city: '',  // Empty city
            state: '', // Empty state
            zipCode: ''
          }
        })
      ).rejects.toThrow()
    })
  })
})