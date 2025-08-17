import type { PrismaClient } from '@prisma/client'
import type { BusinessDTO, CreateBusinessProfileDTO } from '~~/dto/business'

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
})
