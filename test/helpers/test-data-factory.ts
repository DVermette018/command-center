import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient } from '@prisma/client'

export class TestDataFactory {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  // User Factory
  createUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
    return {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'PROJECT_MANAGER',
      isActive: true,
      ...overrides
    }
  }

  // Customer Factory
  createCustomer(overrides: Partial<Prisma.CustomerCreateInput> = {}) {
    return {
      status: 'LEAD',
      source: faker.helpers.arrayElement([
        'REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'OTHER'
      ]),
      ...overrides
    }
  }

  // Project Factory
  createProject(
    customerId: string, 
    managerId?: string, 
    overrides: Partial<Prisma.ProjectCreateInput> = {}
  ) {
    return {
      name: faker.commerce.productName(),
      description: faker.lorem.paragraph(),
      type: 'WEBSITE',
      status: 'DRAFT',
      phase: 'DISCOVERY',
      priority: 'MEDIUM',
      customer: { connect: { id: customerId } },
      ...(managerId ? { projectManager: { connect: { id: managerId } } } : {}),
      ...overrides
    }
  }

  // Business Profile Factory
  createBusinessProfile(
    customerId: string, 
    overrides: Partial<Prisma.BusinessProfileCreateInput> = {}
  ) {
    return {
      businessName: faker.company.name(),
      category: faker.commerce.department(),
      size: 'SMALL',
      description: faker.lorem.paragraph(),
      customer: { connect: { id: customerId } },
      ...overrides
    }
  }

  // Async methods for creating records directly in the database
  async createUserInDb(overrides: Partial<Prisma.UserCreateInput> = {}) {
    const userData = this.createUser(overrides)
    return this._prisma.user.create({ data: userData })
  }

  async createCustomerInDb(overrides: Partial<Prisma.CustomerCreateInput> = {}) {
    const customerData = this.createCustomer(overrides)
    return this._prisma.customer.create({ data: customerData })
  }

  async createProjectInDb(
    customerId: string, 
    managerId?: string, 
    overrides: Partial<Prisma.ProjectCreateInput> = {}
  ) {
    const projectData = this.createProject(customerId, managerId, overrides)
    return this._prisma.project.create({ data: projectData })
  }

  async createBusinessProfileInDb(
    customerId: string, 
    overrides: Partial<Prisma.BusinessProfileCreateInput> = {}
  ) {
    const businessProfileData = this.createBusinessProfile(customerId, overrides)
    return this._prisma.businessProfile.create({ data: businessProfileData })
  }

  // Performance testing utilities
  
  /**
   * Create a batch of customers efficiently for performance testing
   */
  async createCustomerBatch(
    count: number, 
    batchSize: number = 50,
    overrides: Partial<Prisma.CustomerCreateInput> = {}
  ): Promise<Array<{ id: string; status: string; source: string }>> {
    const customers: Array<{ id: string; status: string; source: string }> = []
    const batches = Math.ceil(count / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - batch * batchSize)
      const batchData = Array.from({ length: currentBatchSize }, () => 
        this.createCustomer(overrides)
      )

      const createdBatch = await this._prisma.$transaction(
        batchData.map(data => this._prisma.customer.create({ 
          data,
          select: { id: true, status: true, source: true }
        }))
      )

      customers.push(...createdBatch)

      // Small delay between batches to prevent overwhelming the database
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return customers
  }

  /**
   * Create customers with full business profiles for complex testing
   */
  async createCompleteCustomerBatch(
    count: number,
    batchSize: number = 25
  ): Promise<Array<{ id: string; businessProfile: { id: string; businessName: string } | null }>> {
    const customers: Array<{ id: string; businessProfile: { id: string; businessName: string } | null }> = []
    const batches = Math.ceil(count / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - batch * batchSize)
      
      const batchPromises = Array.from({ length: currentBatchSize }, async (_, index) => {
        const uniqueSuffix = `${batch}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        
        return this._prisma.customer.create({
          data: {
            status: 'LEAD',
            source: faker.helpers.arrayElement([
              'REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'OTHER'
            ]),
            businessProfile: {
              create: {
                businessName: `${faker.company.name()} ${uniqueSuffix}`,
                category: faker.commerce.department(),
                size: 'SMALL',
                description: faker.lorem.paragraph(),
              }
            }
          },
          select: {
            id: true,
            businessProfile: {
              select: {
                id: true,
                businessName: true
              }
            }
          }
        })
      })

      const batchResults = await Promise.all(batchPromises)
      customers.push(...batchResults)

      // Small delay between batches
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    return customers
  }

  /**
   * Create diverse customer data for search testing
   */
  async createSearchTestData(): Promise<{
    leadCustomers: Array<{ id: string }>
    activeCustomers: Array<{ id: string }>
    techCompanies: Array<{ id: string }>
    retailCompanies: Array<{ id: string }>
  }> {
    const [leadCustomers, activeCustomers, techCompanies, retailCompanies] = await Promise.all([
      // Lead customers
      Promise.all(Array.from({ length: 10 }, () => 
        this.createCustomerInDb({ status: 'LEAD' })
      )),
      
      // Active customers
      Promise.all(Array.from({ length: 15 }, () => 
        this.createCustomerInDb({ status: 'ACTIVE' })
      )),

      // Tech companies
      Promise.all(Array.from({ length: 8 }, (_, i) => 
        this.createCompleteCustomer({
          businessName: `TechCorp ${i}`,
          category: 'Technology'
        })
      )),

      // Retail companies
      Promise.all(Array.from({ length: 12 }, (_, i) => 
        this.createCompleteCustomer({
          businessName: `RetailStore ${i}`,
          category: 'Retail'
        })
      ))
    ])

    return {
      leadCustomers: leadCustomers.map(c => ({ id: c.id })),
      activeCustomers: activeCustomers.map(c => ({ id: c.id })),
      techCompanies: techCompanies.map(c => ({ id: c.id })),
      retailCompanies: retailCompanies.map(c => ({ id: c.id }))
    }
  }

  private async createCompleteCustomer(businessData: {
    businessName: string
    category: string
  }): Promise<{ id: string }> {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    
    return this._prisma.customer.create({
      data: {
        status: 'LEAD',
        source: 'WEBSITE',
        businessProfile: {
          create: {
            businessName: businessData.businessName,
            category: businessData.category,
            size: 'MEDIUM',
            description: faker.lorem.paragraph()
          }
        }
      },
      select: { id: true }
    })
  }
}