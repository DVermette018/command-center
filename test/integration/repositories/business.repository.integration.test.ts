import { TestDatabase } from '../../../test/helpers/test-database'
import { TestDataFactory } from '../../../test/helpers/test-data-factory'
import { register as registerBusinessRepository } from '../../../server/repositories/business'
import { faker } from '@faker-js/faker'

describe('Business Repository Integration Tests', () => {
  let testDb: TestDatabase
  let dataFactory: TestDataFactory
  let businessRepository: ReturnType<typeof registerBusinessRepository>

  beforeAll(async () => {
    testDb = await TestDatabase.getInstance()
    dataFactory = new TestDataFactory(testDb.prisma)
    businessRepository = registerBusinessRepository(testDb.prisma)
  })

  beforeEach(async () => {
    await testDb.reset()
  })

  afterAll(async () => {
    await testDb.teardown()
  })

  describe('Create Business Profile', () => {
    it('should create a business profile with a full address', async () => {
      const customer = await dataFactory.createCustomerInDb()

      const businessProfileData = {
        businessName: faker.company.name(),
        legalName: faker.company.name(),
        ownerName: faker.person.fullName(),
        taxId: faker.string.alphanumeric(10),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        website: faker.internet.url(),
        category: 'Technology',
        size: 'SMALL',
        description: faker.lorem.paragraph(),
        yearEstablished: faker.date.past().getFullYear(),
        customer: { connect: { id: customer.id } }
      }

      const createdBusinessProfile = await businessRepository.create({
        ...businessProfileData,
        addresses: {
          create: {
            type: 'MAIN',
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
            isPrimary: true
          }
        }
      })

      expect(createdBusinessProfile).toBeDefined()
      expect(createdBusinessProfile.businessName).toBe(businessProfileData.businessName)
      expect(createdBusinessProfile.category).toBe('Technology')
      expect(createdBusinessProfile.addresses?.[0].city).toBeDefined()
    })
  })

  describe('Retrieve Business Profiles', () => {
    it('should retrieve business profiles with pagination', async () => {
      const customer1 = await dataFactory.createCustomerInDb()
      const customer2 = await dataFactory.createCustomerInDb()

      const businessProfileData1 = {
        businessName: faker.company.name(),
        category: 'Technology',
        size: 'SMALL',
        customer: { connect: { id: customer1.id } }
      }

      const businessProfileData2 = {
        businessName: faker.company.name(),
        category: 'Finance',
        size: 'MEDIUM',
        customer: { connect: { id: customer2.id } }
      }

      await dataFactory.createBusinessProfileInDb(customer1.id, businessProfileData1)
      await dataFactory.createBusinessProfileInDb(customer2.id, businessProfileData2)

      const paginationOptions = { pageIndex: 1, pageSize: 1 }
      const businessProfiles = await businessRepository.getAll(paginationOptions)

      expect(businessProfiles.data.length).toBe(1)
      expect(businessProfiles.pagination.totalCount).toBe(2)
      expect(businessProfiles.pagination.totalPages).toBe(2)
    })

    it('should retrieve business profile by ID with related entities', async () => {
      const customer = await dataFactory.createCustomerInDb()
      const businessProfileData = {
        businessName: faker.company.name(),
        category: 'Technology',
        size: 'SMALL',
        customer: { connect: { id: customer.id } },
        addresses: {
          create: {
            type: 'MAIN',
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
            isPrimary: true
          }
        }
      }

      const createdBusinessProfile = await dataFactory.createBusinessProfileInDb(customer.id, businessProfileData)
      const retrievedBusinessProfile = await businessRepository.getById(createdBusinessProfile.id)

      expect(retrievedBusinessProfile).toBeDefined()
      expect(retrievedBusinessProfile.businessName).toBe(businessProfileData.businessName)
      expect(retrievedBusinessProfile.addresses?.[0].city).toBe(businessProfileData.addresses.create.city)
    })
  })

  describe('Update Business Profile', () => {
    it('should update business profile details', async () => {
      const customer = await dataFactory.createCustomerInDb()
      const businessProfileData = {
        businessName: faker.company.name(),
        category: 'Technology',
        size: 'SMALL',
        customer: { connect: { id: customer.id } }
      }

      const createdBusinessProfile = await dataFactory.createBusinessProfileInDb(customer.id, businessProfileData)
      const updatedBusinessProfile = await businessRepository.update(createdBusinessProfile.id, { 
        businessName: 'Updated Company Name',
        category: 'Finance'
      })

      expect(updatedBusinessProfile.businessName).toBe('Updated Company Name')
      expect(updatedBusinessProfile.category).toBe('Finance')
    })
  })

  describe('Delete Business Profile', () => {
    it('should delete a business profile', async () => {
      const customer = await dataFactory.createCustomerInDb()
      const businessProfileData = {
        businessName: faker.company.name(),
        category: 'Technology',
        size: 'SMALL',
        customer: { connect: { id: customer.id } }
      }

      const createdBusinessProfile = await dataFactory.createBusinessProfileInDb(customer.id, businessProfileData)
      const deleteResult = await businessRepository.delete(createdBusinessProfile.id)

      expect(deleteResult.success).toBe(true)

      // Verify deletion by attempting to retrieve the business profile
      await expect(businessRepository.getById(createdBusinessProfile.id)).rejects.toThrow()
    })
  })

  describe('Search Business Profiles', () => {
    it('should search business profiles by various fields', async () => {
      const customer1 = await dataFactory.createCustomerInDb()
      const customer2 = await dataFactory.createCustomerInDb()

      const businessProfileData1 = {
        businessName: 'Acme Technologies',
        category: 'Technology',
        ownerName: 'John Doe',
        customer: { connect: { id: customer1.id } }
      }

      const businessProfileData2 = {
        businessName: 'Global Finance Inc',
        category: 'Finance',
        ownerName: 'Jane Smith',
        customer: { connect: { id: customer2.id } }
      }

      await dataFactory.createBusinessProfileInDb(customer1.id, businessProfileData1)
      await dataFactory.createBusinessProfileInDb(customer2.id, businessProfileData2)

      // Search by business name
      const businessNameResults = await businessRepository.search('Acme', { pageIndex: 1, pageSize: 10 })
      expect(businessNameResults.data.length).toBe(1)
      expect(businessNameResults.data[0].businessName).toBe('Acme Technologies')

      // Search by category
      const categoryResults = await businessRepository.search('Finance', { pageIndex: 1, pageSize: 10 })
      expect(categoryResults.data.length).toBe(1)
      expect(categoryResults.data[0].businessName).toBe('Global Finance Inc')

      // Search by owner name
      const ownerNameResults = await businessRepository.search('John', { pageIndex: 1, pageSize: 10 })
      expect(ownerNameResults.data.length).toBe(1)
      expect(ownerNameResults.data[0].businessName).toBe('Acme Technologies')
    })
  })
})