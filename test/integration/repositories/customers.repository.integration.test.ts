import { TestDatabase } from '../../../test/helpers/test-database'
import { TestDataFactory } from '../../../test/helpers/test-data-factory'
import { register as registerCustomerRepository } from '../../../server/repositories/customers'
import { CustomerStatus } from '~~/types/customers'
import { faker } from '@faker-js/faker'

describe('Customers Repository Integration Tests', () => {
  let testDb: TestDatabase
  let dataFactory: TestDataFactory
  let customerRepository: ReturnType<typeof registerCustomerRepository>

  beforeAll(async () => {
    testDb = await TestDatabase.getInstance()
    dataFactory = new TestDataFactory(testDb.prisma)
    customerRepository = registerCustomerRepository(testDb.prisma)
  })

  beforeEach(async () => {
    await testDb.reset()
  })

  afterAll(async () => {
    await testDb.teardown()
  })

  describe('Create Customer', () => {
    it('should create a customer with a full business profile and contact', async () => {
      const user = await dataFactory.createUserInDb()

      const customerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          position: 'CEO',
          department: 'Executive'
        },
        business: {
          businessName: faker.company.name(),
          legalName: faker.company.name(),
          ownerName: `${user.firstName} ${user.lastName}`,
          taxId: faker.string.alphanumeric(10),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          website: faker.internet.url(),
          category: 'Technology',
          size: 'SMALL',
          description: faker.lorem.paragraph(),
          address: {
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

      const createdCustomer = await customerRepository.create(customerData)

      expect(createdCustomer).toBeDefined()
      expect(createdCustomer.source).toBe('REFERRAL')
      expect(createdCustomer.status).toBe('LEAD')
      expect(createdCustomer.contacts?.[0].user?.email).toBe(user.email)
      expect(createdCustomer.businessProfile?.businessName).toBe(customerData.business.businessName)
      expect(createdCustomer.businessProfile?.addresses?.[0].city).toBe(customerData.business.address.city)
    })
  })

  describe('Retrieve Customers', () => {
    it('should retrieve customers with pagination', async () => {
      // Create multiple customers
      const user1 = await dataFactory.createUserInDb()
      const user2 = await dataFactory.createUserInDb()

      const customerData1 = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: {
          email: user1.email,
          firstName: user1.firstName,
          lastName: user1.lastName
        },
        business: {
          businessName: faker.company.name(),
          category: 'Technology',
          address: {
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

      const customerData2 = {
        source: 'WEBSITE',
        status: 'OPPORTUNITY' as CustomerStatus,
        contact: {
          email: user2.email,
          firstName: user2.firstName,
          lastName: user2.lastName
        },
        business: {
          businessName: faker.company.name(),
          category: 'Finance',
          address: {
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

      await customerRepository.create(customerData1)
      await customerRepository.create(customerData2)

      const paginationOptions = { pageIndex: 1, pageSize: 1 }
      const customers = await customerRepository.getAll(paginationOptions)

      expect(customers.data.length).toBe(1)
      expect(customers.pagination.totalCount).toBe(2)
      expect(customers.pagination.totalPages).toBe(2)
    })

    it('should retrieve customer by ID with related entities', async () => {
      const user = await dataFactory.createUserInDb()
      const customerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          position: 'CTO',
          department: 'Technology'
        },
        business: {
          businessName: faker.company.name(),
          category: 'Technology',
          address: {
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

      const createdCustomer = await customerRepository.create(customerData)
      const retrievedCustomer = await customerRepository.getById(createdCustomer.id)

      expect(retrievedCustomer).toBeDefined()
      expect(retrievedCustomer.source).toBe('REFERRAL')
      expect(retrievedCustomer.contacts?.[0].position).toBe('CTO')
      expect(retrievedCustomer.businessProfile?.category).toBe('Technology')
    })
  })

  describe('Update Customer', () => {
    it('should update customer status', async () => {
      const user = await dataFactory.createUserInDb()
      const customerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: { email: user.email, firstName: user.firstName, lastName: user.lastName },
        business: {
          businessName: faker.company.name(),
          category: 'Technology',
          address: {
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

      const createdCustomer = await customerRepository.create(customerData)
      const updatedCustomer = await customerRepository.updateStatus(createdCustomer.id, 'OPPORTUNITY')

      expect(updatedCustomer.status).toBe('OPPORTUNITY')
    })

    it('should partially update customer', async () => {
      const user = await dataFactory.createUserInDb()
      const customerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: { email: user.email, firstName: user.firstName, lastName: user.lastName },
        business: {
          businessName: faker.company.name(),
          category: 'Technology',
          address: {
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

      const createdCustomer = await customerRepository.create(customerData)
      const updatedCustomer = await customerRepository.update(createdCustomer.id, { source: 'WEBSITE' })

      expect(updatedCustomer.source).toBe('WEBSITE')
      expect(updatedCustomer.status).toBe('LEAD')
    })
  })

  describe('Delete Customer', () => {
    it('should delete a customer', async () => {
      const user = await dataFactory.createUserInDb()
      const customerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: { email: user.email, firstName: user.firstName, lastName: user.lastName },
        business: {
          businessName: faker.company.name(),
          category: 'Technology',
          address: {
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

      const createdCustomer = await customerRepository.create(customerData)
      const deleteResult = await customerRepository.delete(createdCustomer.id)

      expect(deleteResult.success).toBe(true)

      // Verify deletion by attempting to retrieve the customer
      await expect(customerRepository.getById(createdCustomer.id)).rejects.toThrow()
    })
  })

  describe('Search Customer', () => {
    it('should search customers by various fields', async () => {
      const user1 = await dataFactory.createUserInDb()
      const user2 = await dataFactory.createUserInDb()

      const customerData1 = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: {
          email: user1.email,
          firstName: user1.firstName,
          lastName: user1.lastName
        },
        business: {
          businessName: 'Acme Technologies',
          category: 'Technology',
          address: {
            type: 'MAIN',
            city: 'San Francisco',
            country: 'USA'
          }
        }
      }

      const customerData2 = {
        source: 'WEBSITE',
        status: 'OPPORTUNITY' as CustomerStatus,
        contact: {
          email: user2.email,
          firstName: user2.firstName,
          lastName: user2.lastName
        },
        business: {
          businessName: 'Global Finance Inc',
          category: 'Finance',
          address: {
            type: 'MAIN',
            city: 'New York',
            country: 'USA'
          }
        }
      }

      await customerRepository.create(customerData1)
      await customerRepository.create(customerData2)

      // Search by business name
      const businessNameResults = await customerRepository.search('Acme', { pageIndex: 1, pageSize: 10 })
      expect(businessNameResults.data.length).toBe(1)
      expect(businessNameResults.data[0].businessProfile?.businessName).toBe('Acme Technologies')

      // Search by contact name
      const contactNameResults = await customerRepository.search(user2.firstName, { pageIndex: 1, pageSize: 10 })
      expect(contactNameResults.data.length).toBe(1)
      expect(contactNameResults.data[0].contacts?.[0].user?.firstName).toBe(user2.firstName)
    })
  })

  describe('Variation Tracking', () => {
    it('should calculate customer status variation', async () => {
      const now = new Date()
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

      const user1 = await dataFactory.createUserInDb()
      const user2 = await dataFactory.createUserInDb()

      // Create customers in current and previous periods
      const currentPeriodCustomerData = {
        source: 'REFERRAL',
        status: 'LEAD' as CustomerStatus,
        contact: { email: user1.email, firstName: user1.firstName, lastName: user1.lastName },
        createdAt: now
      }

      const previousPeriodCustomerData = {
        source: 'WEBSITE',
        status: 'LEAD' as CustomerStatus,
        contact: { email: user2.email, firstName: user2.firstName, lastName: user2.lastName },
        createdAt: lastYear
      }

      // Create customers directly in the database to control creation date
      await testDb.prisma.customer.create({ 
        data: { 
          ...currentPeriodCustomerData, 
          createdAt: now,
          contacts: {
            create: {
              user: { connect: { id: user1.id } },
              isPrimary: true
            }
          }
        } 
      })

      await testDb.prisma.customer.create({ 
        data: { 
          ...previousPeriodCustomerData, 
          createdAt: lastYear,
          contacts: {
            create: {
              user: { connect: { id: user2.id } },
              isPrimary: true
            }
          }
        } 
      })

      const variation = await customerRepository.getPeriodVariationByStatus('LEAD', 
        { start: now, end: new Date(now.getFullYear(), 11, 31) }, 
        'YEAR'
      )

      expect(variation.currentPeriod).toBe(1)
      expect(variation.previousPeriod).toBe(1)
      expect(variation.variation).toBe(0)
      expect(variation.percentageChange).toBe(0)
    })
  })
})