import type { PrismaClient } from '@prisma/client'
import type { Pagination, Period, Range } from '~~/types/common'
import type { CustomerStatus } from '~~/types/customers'
import type { CreateCustomerSchema, CustomerDTO } from '~~/dto/customer'
import type { PaginatedResponse } from '~~/types/api'

const CUSTOMER_SELECTOR = {
  id: true,
  source: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  contacts: {
    select: {
      id: true,
      customerId: true,
      position: true,
      department: true,
      isPrimary: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    where: { isPrimary: true }
  },
  businessProfile: {
    select: {
      id: true,
      businessName: true,
      legalName: true,
      ownerName: true,
      taxId: true,
      phone: true,
      email: true,
      category: true,
      customCategory: true,
      size: true,
      website: true,
      description: true,
      productsServices: true,
      yearEstablished: true,
      slogan: true,
      missionStatement: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      additionalColors: true,
      createdAt: true,
      updatedAt: true,
      addresses: {
        select: {
          type: true,
          isPrimary: true,
          street: true,
          street2: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          reference: true,
          coordinates: true
        },
        where: { isPrimary: true }
      }
    }
  }
}

export const register = (db: PrismaClient) => ({
  getPeriodVariationByStatus: async (status: CustomerStatus, range: Range, period: Period) => {
    try {
      const currentPeriod = await db.customer.count({
        where: {
          status,
          createdAt: {
            gte: new Date(range.start),
            lte: new Date(range.end)
          }
        }
      })
      const previousPeriod = await db.customer.count({
        where: {
          status,
          createdAt: {
            gte: new Date(new Date(range.start).setFullYear(range.start.getFullYear() - 1)),
            lte: new Date(new Date(range.end).setFullYear(range.end.getFullYear() - 1))
          }
        }
      })
      return {
        currentPeriod,
        previousPeriod,
        variation: currentPeriod - previousPeriod,
        percentageChange: previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 100
      }
    } catch (error) {
      console.error(`Error fetching total customer count for status ${status}:`, error)
      throw error
    }
  },

  getAll: async (pagination: Pagination): Promise<PaginatedResponse<CustomerDTO>> => {
    try {
      const [customers, customerCount] = await db.$transaction([
        db.customer.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          select: CUSTOMER_SELECTOR,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        db.customer.count()
      ])

      return {
        data: customers.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          contacts: (c.contacts || []).map((contact) => ({
            ...contact,
            position: contact.position ?? undefined,
            department: contact.department ?? undefined,
            user: contact.user ? {
              ...contact.user,
              createdAt: contact.user.createdAt.toISOString(),
              updatedAt: contact.user.updatedAt.toISOString()
            } : undefined
          })),
          businessProfile: c.businessProfile ? {
            businessName: c.businessProfile.businessName,
            legalName: c.businessProfile.legalName || undefined,
            ownerName: c.businessProfile.ownerName || undefined,
            taxId: c.businessProfile.taxId || undefined,
            phone: c.businessProfile.phone || undefined,
            email: c.businessProfile.email || undefined,
            website: c.businessProfile.website || undefined,

            category: c.businessProfile.category,
            size: c.businessProfile.size || undefined,
            customCategory: c.businessProfile.customCategory || undefined,
            yearEstablished: c.businessProfile.yearEstablished || undefined,
            description: c.businessProfile.description || undefined,
            productsServices: c.businessProfile.productsServices || undefined,
            slogan: c.businessProfile.slogan || undefined,
            missionStatement: c.businessProfile.missionStatement || undefined,
            primaryColor: c.businessProfile.primaryColor || undefined,
            secondaryColor: c.businessProfile.secondaryColor || undefined,
            accentColor: c.businessProfile.accentColor || undefined,
            additionalColors: c.businessProfile.additionalColors || undefined,

            addresses: (c.businessProfile.addresses || []).map((address) => ({
              type: address.type,
              street: address.street,
              street2: address.street2 || undefined,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              country: address.country,
              reference: address.reference || undefined,
              isPrimary: address.isPrimary || false
            }))
          } : undefined
        })),
        pagination: {
          totalCount: customerCount,
          totalPages: Math.ceil(customerCount / Math.max(1, pagination.pageSize))
        }
      } satisfies PaginatedResponse<CustomerDTO>
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  },

  getById: async (id: string): Promise<CustomerDTO> => {
    try {
      const c = await db.customer.findUnique({
        where: { id },
        select: CUSTOMER_SELECTOR
      })
      if (!c) {
        throw new Error(`Customer with ID ${id} not found`)
      }
      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        contacts: c.contacts?.map((contact) => ({
          id: contact.id,
          customerId: contact.customerId,
          position: contact.position ?? undefined,
          department: contact.department ?? undefined,
          isPrimary: contact.isPrimary,
          user: contact.user ? {
            ...contact.user,
            createdAt: contact.user.createdAt.toISOString(),
            updatedAt: contact.user.updatedAt.toISOString()
          } : undefined
        })),
        businessProfile: c.businessProfile ? {
          businessName: c.businessProfile.businessName,
          legalName: c.businessProfile.legalName || undefined,
          ownerName: c.businessProfile.ownerName || undefined,
          taxId: c.businessProfile.taxId || undefined,
          phone: c.businessProfile.phone || undefined,
          email: c.businessProfile.email || undefined,
          website: c.businessProfile.website || undefined,

          category: c.businessProfile.category,
          size: c.businessProfile.size || undefined,
          customCategory: c.businessProfile.customCategory || undefined,
          yearEstablished: c.businessProfile.yearEstablished || undefined,
          description: c.businessProfile.description || undefined,
          productsServices: c.businessProfile.productsServices || undefined,
          slogan: c.businessProfile.slogan || undefined,
          missionStatement: c.businessProfile.missionStatement || undefined,
          primaryColor: c.businessProfile.primaryColor || undefined,
          secondaryColor: c.businessProfile.secondaryColor || undefined,
          accentColor: c.businessProfile.accentColor || undefined,
          additionalColors: c.businessProfile.additionalColors || undefined,

          addresses: (c.businessProfile.addresses || []).map((address) => ({
            type: address.type,
            street: address.street,
            street2: address.street2 || undefined,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            reference: address.reference || undefined,
            isPrimary: address.isPrimary || false
          }))
        } : undefined
      } satisfies CustomerDTO
    } catch (error) {
      console.error(`Error fetching customer by ID ${id}:`, error)
      throw error
    }
  },

  create: async (customerData: CreateCustomerSchema): Promise<CustomerDTO> => {
    const user = await db.user.upsert({
      where: {
        email: customerData.contact.email
      },
      update: {},
      create: {
        email: customerData.contact.email,
        firstName: customerData.contact.firstName,
        lastName: customerData.contact.lastName,
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    try {
      const c = await db.customer.create({
        data: {
          source: customerData.source,
          status: customerData.status,
          contacts: {
            create: {
              position: customerData.contact.position,
              department: customerData.contact.department,
              userId: user.id,
              isPrimary: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          businessProfile: {
            create: {
              businessName: customerData.business.businessName,
              legalName: customerData.business.legalName,
              ownerName: customerData.business.ownerName,
              taxId: customerData.business.taxId,
              phone: customerData.business.phone,
              email: customerData.business.email,
              website: customerData.business.website,
              category: customerData.business.category,
              customCategory: customerData.business.customCategory,
              size: customerData.business.size,
              yearEstablished: customerData.business.yearEstablished,
              slogan: customerData.business.slogan,
              missionStatement: customerData.business.missionStatement,
              primaryColor: customerData.business.primaryColor,
              secondaryColor: customerData.business.secondaryColor,
              accentColor: customerData.business.accentColor,
              additionalColors: customerData.business.additionalColors,
              addresses: {
                create: {
                  type: customerData.business.address.type,
                  street: customerData.business.address.street,
                  street2: customerData.business.address.street2,
                  city: customerData.business.address.city,
                  state: customerData.business.address.state,
                  zipCode: customerData.business.address.zipCode,
                  country: customerData.business.address.country,
                  reference: customerData.business.address.reference,
                  coordinates: customerData.business.address.coordinates,
                  isPrimary: customerData.business.address.isPrimary || false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        select: CUSTOMER_SELECTOR
      })
      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        contacts: c.contacts?.map((contact) => ({
          ...contact,
          position: contact.position ?? undefined,
          department: contact.department ?? undefined,
          user: {
            ...contact.user,
            createdAt: contact.user.createdAt.toISOString(),
            updatedAt: contact.user.updatedAt.toISOString()
          }
        })),
        businessProfile: c.businessProfile ? {
          businessName: c.businessProfile.businessName,
          legalName: c.businessProfile.legalName || undefined,
          ownerName: c.businessProfile.ownerName || undefined,
          taxId: c.businessProfile.taxId || undefined,
          phone: c.businessProfile.phone || undefined,
          email: c.businessProfile.email || undefined,
          website: c.businessProfile.website || undefined,

          category: c.businessProfile.category,
          size: c.businessProfile.size || undefined,
          customCategory: c.businessProfile.customCategory || undefined,
          yearEstablished: c.businessProfile.yearEstablished || undefined,
          description: c.businessProfile.description || undefined,
          productsServices: c.businessProfile.productsServices || undefined,
          slogan: c.businessProfile.slogan || undefined,
          missionStatement: c.businessProfile.missionStatement || undefined,
          primaryColor: c.businessProfile.primaryColor || undefined,
          secondaryColor: c.businessProfile.secondaryColor || undefined,
          accentColor: c.businessProfile.accentColor || undefined,
          additionalColors: c.businessProfile.additionalColors || undefined,

          addresses: (c.businessProfile.addresses || []).map((address) => ({
            type: address.type,
            street: address.street,
            street2: address.street2 || undefined,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            reference: address.reference || undefined,
            isPrimary: address.isPrimary || false
          }))
        } : undefined
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  },

  update: async (id: string, customerData: Partial<CreateCustomerSchema>): Promise<CustomerDTO> => {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (customerData.status) {
        updateData.status = customerData.status
      }
      if (customerData.source) {
        updateData.source = customerData.source
      }

      const c = await db.customer.update({
        where: { id },
        data: updateData,
        select: CUSTOMER_SELECTOR
      })

      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        contacts: c.contacts?.map((contact) => ({
          ...contact,
          position: contact.position ?? undefined,
          department: contact.department ?? undefined,
          user: contact.user ? {
            ...contact.user,
            createdAt: contact.user.createdAt.toISOString(),
            updatedAt: contact.user.updatedAt.toISOString()
          } : undefined
        })),
        businessProfile: c.businessProfile ? {
          businessName: c.businessProfile.businessName,
          legalName: c.businessProfile.legalName || undefined,
          ownerName: c.businessProfile.ownerName || undefined,
          taxId: c.businessProfile.taxId || undefined,
          phone: c.businessProfile.phone || undefined,
          email: c.businessProfile.email || undefined,
          website: c.businessProfile.website || undefined,
          category: c.businessProfile.category,
          size: c.businessProfile.size || undefined,
          customCategory: c.businessProfile.customCategory || undefined,
          yearEstablished: c.businessProfile.yearEstablished || undefined,
          description: c.businessProfile.description || undefined,
          productsServices: c.businessProfile.productsServices || undefined,
          slogan: c.businessProfile.slogan || undefined,
          missionStatement: c.businessProfile.missionStatement || undefined,
          primaryColor: c.businessProfile.primaryColor || undefined,
          secondaryColor: c.businessProfile.secondaryColor || undefined,
          accentColor: c.businessProfile.accentColor || undefined,
          additionalColors: c.businessProfile.additionalColors || undefined,
          addresses: (c.businessProfile.addresses || []).map((address) => ({
            type: address.type,
            street: address.street,
            street2: address.street2 || undefined,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            reference: address.reference || undefined,
            isPrimary: address.isPrimary || false
          }))
        } : undefined
      } satisfies CustomerDTO
    } catch (error) {
      console.error(`Error updating customer with ID ${id}:`, error)
      throw error
    }
  },

  updateStatus: async (id: string, status: CustomerStatus, reason?: string): Promise<CustomerDTO> => {
    try {
      const c = await db.customer.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        },
        select: CUSTOMER_SELECTOR
      })

      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        contacts: c.contacts?.map((contact) => ({
          ...contact,
          position: contact.position ?? undefined,
          department: contact.department ?? undefined,
          user: contact.user ? {
            ...contact.user,
            createdAt: contact.user.createdAt.toISOString(),
            updatedAt: contact.user.updatedAt.toISOString()
          } : undefined
        })),
        businessProfile: c.businessProfile ? {
          businessName: c.businessProfile.businessName,
          legalName: c.businessProfile.legalName || undefined,
          ownerName: c.businessProfile.ownerName || undefined,
          taxId: c.businessProfile.taxId || undefined,
          phone: c.businessProfile.phone || undefined,
          email: c.businessProfile.email || undefined,
          website: c.businessProfile.website || undefined,
          category: c.businessProfile.category,
          size: c.businessProfile.size || undefined,
          customCategory: c.businessProfile.customCategory || undefined,
          yearEstablished: c.businessProfile.yearEstablished || undefined,
          description: c.businessProfile.description || undefined,
          productsServices: c.businessProfile.productsServices || undefined,
          slogan: c.businessProfile.slogan || undefined,
          missionStatement: c.businessProfile.missionStatement || undefined,
          primaryColor: c.businessProfile.primaryColor || undefined,
          secondaryColor: c.businessProfile.secondaryColor || undefined,
          accentColor: c.businessProfile.accentColor || undefined,
          additionalColors: c.businessProfile.additionalColors || undefined,
          addresses: (c.businessProfile.addresses || []).map((address) => ({
            type: address.type,
            street: address.street,
            street2: address.street2 || undefined,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            reference: address.reference || undefined,
            isPrimary: address.isPrimary || false
          }))
        } : undefined
      } satisfies CustomerDTO
    } catch (error) {
      console.error(`Error updating customer status with ID ${id}:`, error)
      throw error
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await db.customer.delete({
        where: { id }
      })

      console.log(`Deleted customer with ID ${id}`)
      return {
        success: true,
        message: `Customer with ID ${id} deleted successfully`
      }
    } catch (error) {
      console.error(`Error deleting customer with ID ${id}:`, error)
      throw error
    }
  },

  search: async (query: string, pagination: Pagination): Promise<PaginatedResponse<CustomerDTO>> => {
    try {
      const whereClause = {
        OR: [
          {
            businessProfile: {
              businessName: {
                contains: query,
                mode: 'insensitive' as const
              }
            }
          },
          {
            businessProfile: {
              ownerName: {
                contains: query,
                mode: 'insensitive' as const
              }
            }
          },
          {
            businessProfile: {
              email: {
                contains: query,
                mode: 'insensitive' as const
              }
            }
          },
          {
            contacts: {
              some: {
                user: {
                  OR: [
                    {
                      firstName: {
                        contains: query,
                        mode: 'insensitive' as const
                      }
                    },
                    {
                      lastName: {
                        contains: query,
                        mode: 'insensitive' as const
                      }
                    },
                    {
                      email: {
                        contains: query,
                        mode: 'insensitive' as const
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      }

      const [customers, customerCount] = await db.$transaction([
        db.customer.findMany({
          where: whereClause,
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          select: CUSTOMER_SELECTOR,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        db.customer.count({ where: whereClause })
      ])

      return {
        data: customers.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          contacts: (c.contacts || []).map((contact) => ({
            ...contact,
            position: contact.position ?? undefined,
            department: contact.department ?? undefined,
            user: contact.user ? {
              ...contact.user,
              createdAt: contact.user.createdAt.toISOString(),
              updatedAt: contact.user.updatedAt.toISOString()
            } : undefined
          })),
          businessProfile: c.businessProfile ? {
            businessName: c.businessProfile.businessName,
            legalName: c.businessProfile.legalName || undefined,
            ownerName: c.businessProfile.ownerName || undefined,
            taxId: c.businessProfile.taxId || undefined,
            phone: c.businessProfile.phone || undefined,
            email: c.businessProfile.email || undefined,
            website: c.businessProfile.website || undefined,
            category: c.businessProfile.category,
            size: c.businessProfile.size || undefined,
            customCategory: c.businessProfile.customCategory || undefined,
            yearEstablished: c.businessProfile.yearEstablished || undefined,
            description: c.businessProfile.description || undefined,
            productsServices: c.businessProfile.productsServices || undefined,
            slogan: c.businessProfile.slogan || undefined,
            missionStatement: c.businessProfile.missionStatement || undefined,
            primaryColor: c.businessProfile.primaryColor || undefined,
            secondaryColor: c.businessProfile.secondaryColor || undefined,
            accentColor: c.businessProfile.accentColor || undefined,
            additionalColors: c.businessProfile.additionalColors || undefined,
            addresses: (c.businessProfile.addresses || []).map((address) => ({
              type: address.type,
              street: address.street,
              street2: address.street2 || undefined,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              country: address.country,
              reference: address.reference || undefined,
              isPrimary: address.isPrimary || false
            }))
          } : undefined
        })),
        pagination: {
          totalCount: customerCount,
          totalPages: Math.ceil(customerCount / Math.max(1, pagination.pageSize))
        }
      } satisfies PaginatedResponse<CustomerDTO>
    } catch (error) {
      console.error('Error searching customers:', error)
      throw error
    }
  }
})
