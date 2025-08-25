import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { PaginatedResponse } from '~~/types/api'
import type { BusinessDTO, CreateBusinessProfileDTO, UpdateBusinessProfileDTO } from '~~/dto/business'

export const register = (db: PrismaClient) => ({
  create: async (data: CreateBusinessProfileDTO): Promise<BusinessDTO> => {
    const b = await db.businessProfile.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
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
    })
    return {
      businessName: b.businessName,
      legalName: b.legalName || undefined,
      ownerName: b.ownerName || undefined,
      taxId: b.taxId || undefined,
      phone: b.phone || undefined,
      email: b.email || undefined,
      website: b.website || undefined,

      category: b.category,
      size: b.size || undefined,
      customCategory: b.customCategory || undefined,
      yearEstablished: b.yearEstablished || undefined,
      description: b.description || undefined,
      productsServices: b.productsServices || undefined,
      slogan: b.slogan || undefined,
      missionStatement: b.missionStatement || undefined,
      primaryColor: b.primaryColor || undefined,
      secondaryColor: b.secondaryColor || undefined,
      accentColor: b.accentColor || undefined,
      additionalColors: b.additionalColors || undefined,

      addresses: (b.addresses || []).map((a) => ({
        type: a.type,
        street: a.street,
        street2: a.street2 || undefined,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
        country: a.country,
        reference: a.reference || undefined,
        isPrimary: a.isPrimary || false
      }))
    }
  },

  getById: async (id: string): Promise<BusinessDTO> => {
    try {
      const b = await db.businessProfile.findUnique({
        where: { id },
        include: {
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
            }
          }
        }
      })

      if (!b) {
        throw new Error(`Business profile with ID ${id} not found`)
      }

      return {
        businessName: b.businessName,
        legalName: b.legalName || undefined,
        ownerName: b.ownerName || undefined,
        taxId: b.taxId || undefined,
        phone: b.phone || undefined,
        email: b.email || undefined,
        website: b.website || undefined,
        category: b.category,
        size: b.size || undefined,
        customCategory: b.customCategory || undefined,
        yearEstablished: b.yearEstablished || undefined,
        description: b.description || undefined,
        productsServices: b.productsServices || undefined,
        slogan: b.slogan || undefined,
        missionStatement: b.missionStatement || undefined,
        primaryColor: b.primaryColor || undefined,
        secondaryColor: b.secondaryColor || undefined,
        accentColor: b.accentColor || undefined,
        additionalColors: b.additionalColors || undefined,
        addresses: (b.addresses || []).map((a) => ({
          type: a.type,
          street: a.street,
          street2: a.street2 || undefined,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          country: a.country,
          reference: a.reference || undefined,
          isPrimary: a.isPrimary || false
        }))
      }
    } catch (error) {
      console.error(`Error fetching business profile with ID ${id}:`, error)
      throw error
    }
  },

  getAll: async (pagination: Pagination): Promise<PaginatedResponse<BusinessDTO>> => {
    try {
      const [businesses, businessCount] = await db.$transaction([
        db.businessProfile.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
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
              }
            }
          }
        }),
        db.businessProfile.count()
      ])

      return {
        data: businesses.map(b => ({
          businessName: b.businessName,
          legalName: b.legalName || undefined,
          ownerName: b.ownerName || undefined,
          taxId: b.taxId || undefined,
          phone: b.phone || undefined,
          email: b.email || undefined,
          website: b.website || undefined,
          category: b.category,
          size: b.size || undefined,
          customCategory: b.customCategory || undefined,
          yearEstablished: b.yearEstablished || undefined,
          description: b.description || undefined,
          productsServices: b.productsServices || undefined,
          slogan: b.slogan || undefined,
          missionStatement: b.missionStatement || undefined,
          primaryColor: b.primaryColor || undefined,
          secondaryColor: b.secondaryColor || undefined,
          accentColor: b.accentColor || undefined,
          additionalColors: b.additionalColors || undefined,
          addresses: (b.addresses || []).map((a) => ({
            type: a.type,
            street: a.street,
            street2: a.street2 || undefined,
            city: a.city,
            state: a.state,
            zipCode: a.zipCode,
            country: a.country,
            reference: a.reference || undefined,
            isPrimary: a.isPrimary || false
          }))
        })),
        pagination: {
          totalCount: businessCount,
          totalPages: Math.ceil(businessCount / Math.max(1, pagination.pageSize))
        }
      }
    } catch (error) {
      console.error('Error fetching business profiles:', error)
      throw error
    }
  },

  update: async (id: string, updateData: Partial<UpdateBusinessProfileDTO>): Promise<BusinessDTO> => {
    try {
      const b = await db.businessProfile.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
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
            }
          }
        }
      })

      return {
        businessName: b.businessName,
        legalName: b.legalName || undefined,
        ownerName: b.ownerName || undefined,
        taxId: b.taxId || undefined,
        phone: b.phone || undefined,
        email: b.email || undefined,
        website: b.website || undefined,
        category: b.category,
        size: b.size || undefined,
        customCategory: b.customCategory || undefined,
        yearEstablished: b.yearEstablished || undefined,
        description: b.description || undefined,
        productsServices: b.productsServices || undefined,
        slogan: b.slogan || undefined,
        missionStatement: b.missionStatement || undefined,
        primaryColor: b.primaryColor || undefined,
        secondaryColor: b.secondaryColor || undefined,
        accentColor: b.accentColor || undefined,
        additionalColors: b.additionalColors || undefined,
        addresses: (b.addresses || []).map((a) => ({
          type: a.type,
          street: a.street,
          street2: a.street2 || undefined,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          country: a.country,
          reference: a.reference || undefined,
          isPrimary: a.isPrimary || false
        }))
      }
    } catch (error) {
      console.error(`Error updating business profile with ID ${id}:`, error)
      throw error
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await db.businessProfile.delete({
        where: { id }
      })

      return {
        success: true,
        message: `Business profile with ID ${id} deleted successfully`
      }
    } catch (error) {
      console.error(`Error deleting business profile with ID ${id}:`, error)
      throw error
    }
  },

  search: async (query: string, pagination: Pagination): Promise<PaginatedResponse<BusinessDTO>> => {
    try {
      const [businesses, businessCount] = await db.$transaction([
        db.businessProfile.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' },
          where: {
            OR: [
              { businessName: { contains: query, mode: 'insensitive' } },
              { legalName: { contains: query, mode: 'insensitive' } },
              { ownerName: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } }
            ]
          },
          include: {
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
              }
            }
          }
        }),
        db.businessProfile.count({
          where: {
            OR: [
              { businessName: { contains: query, mode: 'insensitive' } },
              { legalName: { contains: query, mode: 'insensitive' } },
              { ownerName: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } }
            ]
          }
        })
      ])

      return {
        data: businesses.map(b => ({
          businessName: b.businessName,
          legalName: b.legalName || undefined,
          ownerName: b.ownerName || undefined,
          taxId: b.taxId || undefined,
          phone: b.phone || undefined,
          email: b.email || undefined,
          website: b.website || undefined,
          category: b.category,
          size: b.size || undefined,
          customCategory: b.customCategory || undefined,
          yearEstablished: b.yearEstablished || undefined,
          description: b.description || undefined,
          productsServices: b.productsServices || undefined,
          slogan: b.slogan || undefined,
          missionStatement: b.missionStatement || undefined,
          primaryColor: b.primaryColor || undefined,
          secondaryColor: b.secondaryColor || undefined,
          accentColor: b.accentColor || undefined,
          additionalColors: b.additionalColors || undefined,
          addresses: (b.addresses || []).map((a) => ({
            type: a.type,
            street: a.street,
            street2: a.street2 || undefined,
            city: a.city,
            state: a.state,
            zipCode: a.zipCode,
            country: a.country,
            reference: a.reference || undefined,
            isPrimary: a.isPrimary || false
          }))
        })),
        pagination: {
          totalCount: businessCount,
          totalPages: Math.ceil(businessCount / Math.max(1, pagination.pageSize))
        }
      }
    } catch (error) {
      console.error('Error searching business profiles:', error)
      throw error
    }
  }
})
